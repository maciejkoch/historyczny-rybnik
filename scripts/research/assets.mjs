import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { loadWorkspace, safePath, hash } from './workspace.mjs';
export function publicationImages(material) {
  return material.publicationImages.map((image) => ({
    ...image,
    storagePath: `public/materials/${material.id}/${image.sha256}${extname(image.storagePath)}`,
    thumbnailPath: `public/materials/${material.id}/${image.thumbnailSha256}${extname(image.thumbnailPath)}`,
  }));
}
export async function prepareAssets(root) {
  const d = await loadWorkspace(root),
    used = new Set(
      d.places
        .filter((p) => p.publicationApproved)
        .flatMap((p) =>
          p.mentionIds.flatMap((id) =>
            d.mentions
              .filter((m) => m.id === id && m.verification === 'verified')
              .flatMap((m) => m.materialIds),
          ),
        ),
    );
  const assets = new Map();
  for (const m of d.materials.filter((m) => used.has(m.id) && m.rights.publicationApproved))
    for (const image of publicationImages(m))
      for (const [key, checksum] of [
        ['storagePath', 'sha256'],
        ['thumbnailPath', 'thumbnailSha256'],
      ]) {
        const path = image[key];
        if (!path.startsWith(`public/materials/${m.id}/`))
          throw new Error('Public asset belongs to another material');
        const file = m.files.find((f) => f.sha256 === image[checksum]);
        if (!file) throw new Error(`Missing local publication file: ${path}`);
        const ext = extname(path),
          mime = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext];
        const bytes = await readFile(await safePath(root, file.path));
        if (!mime || bytes.length > 3000000 || hash(bytes) !== image[checksum])
          throw new Error('Public image size/hash/type invalid');
        const prior = assets.get(path);
        if (prior && hash(prior.bytes) !== hash(bytes))
          throw new Error('Conflicting asset at public path');
        assets.set(path, { path, bytes, mime });
      }
  return [...assets.values()];
}
