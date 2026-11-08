import { readdir, readFile, lstat, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, relative, sep, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { schemas, validateWorkspace } from '../model/schema.mjs';
export const defaultRoot = resolve('data/places');
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export async function safePath(root, name) {
  const path = resolve(root, name),
    rel = relative(root, path);
  if (!rel || rel.startsWith('..' + sep) || rel === '..' || rel.startsWith(sep))
    throw new Error('Path outside workspace');
  let cursor = resolve(root);
  if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Symlink root forbidden');
  for (const part of rel.split(sep)) {
    cursor = resolve(cursor, part);
    try {
      if ((await lstat(cursor)).isSymbolicLink()) throw new Error('Symlinks forbidden');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  return path;
}
export async function atomicWrite(path, bytes) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = path + '.' + crypto.randomUUID() + '.tmp';
  await writeFile(tmp, bytes, { flag: 'wx' });
  await rename(tmp, path);
}
export async function loadWorkspace(root = defaultRoot, { verifyFiles = true } = {}) {
  const read = async (name) => JSON.parse(await readFile(await safePath(root, name), 'utf8'));
  const data = { config: await read('config.json'), tags: await read('tags.json') };
  for (const key of Object.keys(schemas)) {
    const folder = await safePath(root, key);
    const files = await readdir(folder);
    data[key] = [];
    for (const name of files.filter((n) => n.endsWith('.json')).sort()) {
      const row = await read(`${key}/${name}`);
      if (name !== row.id + '.json') throw new Error(`Filename must match ID: ${name}`);
      data[key].push(row);
    }
  }
  const parsed = validateWorkspace(data);
  if (verifyFiles)
    for (const m of [...parsed.documents, ...parsed.materials])
      for (const f of m.files) {
        const bytes = await readFile(await safePath(root, f.path));
        if (hash(bytes) !== f.sha256) throw new Error(`File checksum mismatch: ${f.path}`);
      }
  return parsed;
}
export async function initWorkspace(root = defaultRoot) {
  await mkdir(root, { recursive: true });
  for (const key of [...Object.keys(schemas), 'files'])
    await mkdir(await safePath(root, key), { recursive: true });
  for (const [name, value] of Object.entries({
    'config.json': {
      schemaVersion: 3,
      city: 'Rybnik',
      period: { from: 1918, to: 1939, flexible: true },
    },
    'tags.json': [],
  })) {
    const path = await safePath(root, name);
    try {
      await writeFile(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
    }
  }
}
export async function inventory(root) {
  const files = {};
  async function walk(dir) {
    for (const entry of await readdir(await safePath(root, dir), { withFileTypes: true })) {
      const name = `${dir}/${entry.name}`;
      const path = await safePath(root, name);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) {
        const bytes = await readFile(path);
        files[name] = { sha256: hash(bytes), size: bytes.length };
      } else throw new Error('Unsupported file');
    }
  }
  for (const key of [...Object.keys(schemas), 'files']) await walk(key);
  for (const name of ['config.json', 'tags.json']) {
    const b = await readFile(await safePath(root, name));
    files[name] = { sha256: hash(b), size: b.length };
  }
  return Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
}
