import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { HttpsError } from 'firebase-functions/v2/https';
import { creatorIdRequestSchema } from './contracts/creator.mjs';
import { requireCreatorIdentity } from './creator.mjs';
import { requireApp } from './service.mjs';

const maxBytes = 8 * 1024 * 1024;
const hash = (value) => createHash('sha256').update(value).digest('hex');

export async function uploadCreatorMaterial(db, bucket, request, local = false) {
  if (!local) requireApp(request);
  requireCreatorIdentity(request);
  const data = request.data;
  if (
    !data ||
    Object.keys(data).sort().join(',') !== 'content,id' ||
    !creatorIdRequestSchema.safeParse({ id: data.id }).success ||
    typeof data.content !== 'string' ||
    data.content.length > Math.ceil(maxBytes / 3) * 4 ||
    data.content.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(data.content)
  )
    throw new HttpsError('invalid-argument', 'Invalid image');
  const bytes = Buffer.from(data.content, 'base64');
  if (!bytes.length || bytes.length > maxBytes || bytes.toString('base64') !== data.content)
    throw new HttpsError('invalid-argument', 'Invalid image');
  if (!(await db.collection('placeDrafts').doc(data.id).get()).exists)
    throw new HttpsError('not-found', 'Draft unavailable');
  let image, thumbnail, info;
  try {
    const source = sharp(bytes, { limitInputPixels: 40000000, failOn: 'error' });
    const meta = await source.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format) || (meta.pages ?? 1) !== 1)
      throw new Error('Unsupported image');
    ({ data: image, info } = await source
      .rotate()
      .webp({ quality: 90 })
      .toBuffer({ resolveWithObject: true }));
    thumbnail = await sharp(image)
      .resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new HttpsError('invalid-argument', 'Unsupported or invalid image');
  }
  const materialId = randomUUID();
  const storagePath = `public/materials/${materialId}/image.webp`;
  const thumbnailPath = `public/materials/${materialId}/thumbnail.webp`;
  await Promise.all([
    bucket
      .file(storagePath)
      .save(image, {
        resumable: false,
        contentType: 'image/webp',
        preconditionOpts: { ifGenerationMatch: 0 },
      }),
    bucket
      .file(thumbnailPath)
      .save(thumbnail, {
        resumable: false,
        contentType: 'image/webp',
        preconditionOpts: { ifGenerationMatch: 0 },
      }),
  ]);
  return {
    materialId,
    storagePath,
    thumbnailPath,
    width: info.width,
    height: info.height,
    sha256: hash(image),
    thumbnailSha256: hash(thumbnail),
    date: null,
    alt: '',
    source: null,
    sourceUrl: null,
    isPrimary: false,
  };
}
