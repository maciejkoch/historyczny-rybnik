import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicCatalog } from '../../scripts/places/catalog.mjs';
const testData = JSON.parse(readFileSync(new URL('../../data/places.test-data.json', import.meta.url)));
test('SSG preserves image provenance and variant hashes from the place document', () => {
  const result = publicCatalog(testData);
  const image = result[0].mentions.find((ref) => ref.materials.length).materials[0];
  assert.deepEqual(image, testData[0].mentions.find((ref) => ref.materials.length).materials[0]);
  assert.equal(image.provenance.rightsCheckedAt, '2026-11-05');
  assert.match(image.sha256, /^[a-f0-9]{64}$/);
});
test('SSG excludes drafts and rejects unexpected fields', () => {
  const draft = structuredClone(testData[0]);
  draft.id = 'draft';
  draft.slug = 'draft';
  draft.published = false;
  draft.mentions.forEach((ref) => {
    ref.materials = [];
  });
  const result = publicCatalog([...testData, draft]);
  assert.equal(result.length, 1);
  assert.equal(result[0].published, undefined);
  assert.equal(result[0].createdAt, undefined);
  assert.throws(() => publicCatalog([{ ...testData[0], privateNote: 'secret' }]));
});
test('missing location and reference without scan are valid local variants', () => {
  const value = structuredClone(testData);
  value[0].location = { coordinates: null, precision: 'unknown', explanation: null };
  const result = publicCatalog(value);
  assert.equal(result[0].location.coordinates, null);
  assert.deepEqual(result[0].mentions[0].materials, []);
});
