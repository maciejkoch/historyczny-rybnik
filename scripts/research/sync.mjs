import { readFile, mkdir, rename, rm, copyFile, lstat } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { z } from 'zod';
import { schemas } from './model.mjs';
import {
  inventory,
  hash,
  loadWorkspace,
  safePath,
  atomicWrite,
  initWorkspace,
} from './workspace.mjs';
import { prefix } from './storage.mjs';
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const allowedPath = z
  .string()
  .refine(
    (s) =>
      s === 'config.json' ||
      s === 'tags.json' ||
      /^(sources|documents|mentions|materials|places|candidates|out-of-period|research)\/[a-zA-Z0-9_-]+\.json$/.test(
        s,
      ) ||
      /^files\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/.test(s),
  )
  .refine((s) => !s.split('/').includes('..'));
const manifestSchema = z.strictObject({
  version: z.literal(1),
  files: z.record(
    allowedPath,
    z.strictObject({ sha256: digest, size: z.number().int().min(0).max(200000000) }),
  ),
});
const headSchema = z.strictObject({ revision: digest, previous: digest.nullable() });
const stateSchema = z.strictObject({
  revision: digest.nullable(),
  files: manifestSchema.shape.files,
});
const bytes = (x) => Buffer.from(JSON.stringify(x));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function diff(before, after) {
  return {
    write: Object.keys(after).filter((k) => before[k]?.sha256 !== after[k].sha256),
    remove: Object.keys(before).filter((k) => !after[k]),
  };
}
async function state(root) {
  try {
    return stateSchema.parse(
      JSON.parse(await readFile(await safePath(root, '.sync-state.json'), 'utf8')),
    );
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}
async function remoteHead(store) {
  const r = await store.get(prefix + 'head.json');
  return r
    ? { ...headSchema.parse(JSON.parse(r.bytes)), generation: r.generation }
    : { revision: null, previous: null, generation: '0' };
}
async function manifest(store, revision) {
  if (!revision) return { version: 1, files: {} };
  const r = await store.get(prefix + `revisions/${revision}/manifest.json`);
  if (!r || hash(r.bytes) !== revision) throw new Error('Missing/corrupt remote manifest');
  return manifestSchema.parse(JSON.parse(r.bytes));
}
async function immutable(store, name, data) {
  try {
    await store.put(name, data);
  } catch (e) {
    if (e.status !== 412) throw e;
    const r = await store.get(name);
    if (!r || hash(r.bytes) !== hash(data)) throw e;
  }
}
export async function syncWorkspace({
  root,
  store,
  direction,
  apply = false,
  approveDeletions = false,
  restoreRevision = null,
}) {
  root = resolve(root);
  if (!['push', 'pull', 'restore'].includes(direction))
    throw new Error('Unknown synchronization direction');
  const lock = root + '.sync-lock';
  await mkdir(dirname(root), { recursive: true });
  await mkdir(lock); // exclusive local operator; a stale lock requires checking the previous process
  try {
    await initWorkspace(root);
    const head = await remoteHead(store),
      baseline = await state(root),
      local = await inventory(root);
    const revision = restoreRevision ? digest.parse(restoreRevision) : head.revision;
    const remote = await manifest(store, revision);
    if (direction === 'push') {
      await loadWorkspace(root);
      if (!baseline && head.revision)
        throw new Error('Pull before first push into an existing archive');
      if (baseline && baseline.revision !== head.revision && !same(local, remote.files))
        throw new Error('Remote changed since last pull/push; reconcile before sending');
      const plan = diff(remote.files, local);
      if (
        !Object.keys(local).some((k) => Object.keys(schemas).some((s) => k.startsWith(s + '/'))) &&
        Object.keys(remote.files).some((k) => k !== 'config.json' && k !== 'tags.json')
      )
        throw new Error('Empty local workspace cannot erase archive');
      if (!apply) return { direction, revision: head.revision, ...plan };
      if (plan.remove.length && !approveDeletions)
        throw new Error('Deletion preview required: rerun with --approve-deletions after review');
      const m = bytes(manifestSchema.parse({ version: 1, files: local })),
        next = hash(m);
      if (next === head.revision) {
        await atomicWrite(
          await safePath(root, '.sync-state.json'),
          bytes({ revision: next, files: local }),
        );
        return { direction, revision: next, ...plan };
      }
      const queue = Object.entries(local);
      let cursor = 0;
      const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
        while (cursor < queue.length) {
          const [name, info] = queue[cursor++];
          const b = await readFile(await safePath(root, name));
          if (hash(b) !== info.sha256) throw new Error('Local file changed during upload');
          await immutable(store, prefix + `revisions/${next}/${name}`, b);
        }
      });
      const settled = await Promise.allSettled(workers);
      const failure = settled.find((r) => r.status === 'rejected');
      if (failure) throw failure.reason;
      await immutable(store, prefix + `revisions/${next}/manifest.json`, m);
      if (!same(local, await inventory(root)))
        throw new Error('Local workspace changed during upload');
      if (head.revision !== next)
        await store.put(
          prefix + 'head.json',
          bytes({ revision: next, previous: head.revision }),
          head.generation,
        );
      await atomicWrite(
        await safePath(root, '.sync-state.json'),
        bytes({ revision: next, files: local }),
      );
      return { direction, revision: next, ...plan };
    }
    if (!revision) return { direction, revision: null, write: [], remove: [] };
    if (direction === 'restore' && !restoreRevision)
      throw new Error('Specify a revision to restore');
    // Refuse overwriting edits. A first pull accepts only a freshly initialized empty workspace.
    const empty =
      Object.keys(local).every((k) => ['config.json', 'tags.json'].includes(k)) &&
      JSON.parse(await readFile(await safePath(root, 'tags.json'), 'utf8')).length === 0;
    if (baseline ? !same(local, baseline.files) : !empty)
      throw new Error('Local changes must be sent or backed up before pulling/restoring');
    const plan = diff(local, remote.files);
    if (!apply) return { direction, revision, ...plan };
    if (plan.remove.length && !approveDeletions)
      throw new Error('Deletion preview required: use --approve-deletions');
    const stage = root + '.stage-' + crypto.randomUUID();
    await initWorkspace(stage);
    try {
      const queue = Object.entries(remote.files);
      let cursor = 0;
      const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
        while (cursor < queue.length) {
          const [name, info] = queue[cursor++];
          const r = await store.get(prefix + `revisions/${revision}/${name}`);
          if (!r || r.bytes.length !== info.size || hash(r.bytes) !== info.sha256)
            throw new Error(`Remote checksum mismatch: ${name}`);
          await atomicWrite(await safePath(stage, name), r.bytes);
        }
      });
      const settled = await Promise.allSettled(workers);
      const failure = settled.find((r) => r.status === 'rejected');
      if (failure) throw failure.reason;
      await loadWorkspace(stage);
      if (
        (await remoteHead(store)).generation !== head.generation ||
        !same(local, await inventory(root))
      )
        throw new Error('Workspace changed during pull');
      try {
        await copyFile(await safePath(root, 'README.md'), await safePath(stage, 'README.md'));
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }
      await atomicWrite(
        await safePath(stage, '.sync-state.json'),
        bytes({ revision: head.revision, files: remote.files }),
      );
      const backup = resolve('.local/research-backups', basename(root) + '-' + crypto.randomUUID());
      await mkdir(dirname(backup), { recursive: true });
      await rename(root, backup);
      try {
        await rename(stage, root);
      } catch (e) {
        await rename(backup, root);
        throw e;
      }
      return { direction, revision, backup, ...plan };
    } finally {
      await rm(stage, { recursive: true, force: true });
    }
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}
