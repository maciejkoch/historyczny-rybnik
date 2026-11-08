import { loadWorkspace, hash, safePath, atomicWrite } from './workspace.mjs';
import { extname } from 'node:path';
export async function hydrate({ root, store, apply = false }) {
  const d = await loadWorkspace(root);
  let count = 0;
  for (const m of d.materials.filter(
    (m) => m.rights.publicationApproved && m.rights.downloadAllowed,
  )) {
    for (const image of m.publicationImages)
      for (const [pathKey, sumKey, role] of [
        ['storagePath', 'sha256', 'crop'],
        ['thumbnailPath', 'thumbnailSha256', 'thumbnail'],
      ]) {
        const path = `files/imported/${image[sumKey]}${extname(image[pathKey])}`;
        if (m.files.some((f) => f.path === path)) continue;
        count++;
        if (!apply) continue;
        const bytes = await store.getPublicAsset(image[pathKey]);
        if (hash(bytes) !== image[sumKey])
          throw new Error(`Published checksum mismatch: ${image[pathKey]}`);
        await atomicWrite(await safePath(root, path), bytes);
        m.files.push({
          path,
          sha256: image[sumKey],
          role,
          derivedFrom:
            role === 'thumbnail'
              ? `files/imported/${image.sha256}${extname(image.storagePath)}`
              : null,
          transformations: image.provenance.transformations,
        });
      }
    if (apply)
      await atomicWrite(
        await safePath(root, `materials/${m.id}.json`),
        JSON.stringify(m, null, 2) + '\n',
      );
  }
  if (apply) await loadWorkspace(root);
  return { preview: !apply, files: count };
}
