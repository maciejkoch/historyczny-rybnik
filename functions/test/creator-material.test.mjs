import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { uploadCreatorMaterial } from '../src/creator-material.mjs';

const auth = { token: { admin: true, firebase: { sign_in_provider: 'google.com' } } };
const db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: true }) }) }) };
function storage() {
  const files = new Map();
  return { files, bucket: { file: (path) => ({ save: async (bytes) => files.set(path, bytes) }) } };
}
test('uploads validated image and thumbnail and returns matching metadata', async () => {
  const image = await sharp({ create: { width: 800, height: 600, channels: 3, background: 'red' } })
    .png()
    .toBuffer();
  const { bucket, files } = storage();
  const material = await uploadCreatorMaterial(
    db,
    bucket,
    { auth, data: { id: 'draft', content: image.toString('base64') } },
    true,
  );
  assert.equal(files.size, 2);
  assert.equal(material.width, 800);
  assert.equal(material.height, 600);
  assert.equal((await sharp(files.get(material.thumbnailPath)).metadata()).width, 400);
  assert.match(material.sha256, /^[0-9a-f]{64}$/);
});
test('rejects unauthorized and invalid uploads without writes', async () => {
  const { bucket, files } = storage();
  await assert.rejects(
    uploadCreatorMaterial(db, bucket, { data: { id: 'draft', content: 'YWJj' } }, true),
    { code: 'unauthenticated' },
  );
  await assert.rejects(
    uploadCreatorMaterial(db, bucket, { auth, data: { id: 'draft', content: 'YWJj' } }),
    { code: 'unauthenticated' },
  );
  await assert.rejects(
    uploadCreatorMaterial(db, bucket, { auth, data: { id: 'draft', content: 'YWJj' } }, true),
    { code: 'invalid-argument' },
  );
  await assert.rejects(
    uploadCreatorMaterial(
      db,
      bucket,
      {
        auth: { token: { firebase: { sign_in_provider: 'google.com' } } },
        data: { id: 'draft', content: 'YWJj' },
      },
      true,
    ),
    { code: 'permission-denied' },
  );
  assert.equal(files.size, 0);
});
