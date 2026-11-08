import { readFile, stat } from 'node:fs/promises';
import { extname } from 'node:path';
import { loadWorkspace, safePath, hash, atomicWrite } from './workspace.mjs';

// Internal copies do not imply permission to publish. Identical bytes share one file.
export async function capture({
  root,
  materialId,
  collection = 'materials',
  input,
  role = 'original',
  derivedFrom = null,
  transformations = null,
  apply = false,
}) {
  const data = await loadWorkspace(root);
  if (!['documents', 'materials'].includes(collection)) throw new Error('Invalid collection');
  const material = data[collection].find((m) => m.id === materialId);
  if (!material) throw new Error('Unknown material');
  if (!['original', 'scan', 'crop', 'thumbnail'].includes(role)) throw new Error('Invalid role');
  if ((await stat(input)).size > 200000000) throw new Error('File too large');
  const bytes = await readFile(input);
  const ext = extname(input).toLowerCase();
  if (!['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(ext))
    throw new Error('Unsupported archive format');
  const valid =
    ext === '.pdf'
      ? bytes.subarray(0, 5).toString() === '%PDF-'
      : ext === '.png'
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : ['.jpg', '.jpeg'].includes(ext)
          ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          : bytes.subarray(0, 4).toString() === 'RIFF' &&
            bytes.subarray(8, 12).toString() === 'WEBP';
  if (!valid) throw new Error('File content does not match format');
  const all = [...data.documents, ...data.materials].flatMap((m) => m.files);
  if (derivedFrom && !all.some((f) => f.path === derivedFrom)) throw new Error('Missing original');
  if (['scan', 'crop', 'thumbnail'].includes(role) && (!derivedFrom || !transformations))
    throw new Error('Derived copy requires original and transformations');
  const sum = hash(bytes);
  const path =
    all.find((f) => f.sha256 === sum)?.path ||
    `files/archive/${sum}${ext === '.jpeg' ? '.jpg' : ext}`;
  if (path === derivedFrom) throw new Error('File cannot derive from itself');
  if (apply) {
    // Do not silently overwrite a corrupt existing shared file.
    const target = await safePath(root, path);
    try {
      if (hash(await readFile(target)) !== sum) throw new Error('Existing file checksum mismatch');
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
      await atomicWrite(target, bytes);
    }
    if (!material.files.some((f) => f.path === path && f.role === role)) {
      material.files.push({ path, sha256: sum, role, derivedFrom, transformations });
      material.updatedAt = new Date().toISOString();
      await atomicWrite(
        await safePath(root, `${collection}/${material.id}.json`),
        JSON.stringify(material, null, 2) + '\n',
      );
    }
  }
  return { preview: !apply, materialId, path, sha256: sum, role, size: bytes.length };
}
