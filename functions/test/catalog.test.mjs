import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicCatalog } from '../../scripts/places/catalog.mjs';
const seed = JSON.parse(readFileSync(new URL('../../data/places.seed.json', import.meta.url)));
test('SSG preserves image provenance and variant hashes from the place document', () => {
  const result = publicCatalog(seed);
  const image = result[0].references.find((ref) => ref.images.length).images[0];
  assert.deepEqual(image, seed[0].references.find((ref) => ref.images.length).images[0]);
  assert.equal(image.provenance.rightsCheckedAt, '2026-11-05');
  assert.match(image.sha256, /^[a-f0-9]{64}$/);
});
test('SSG excludes drafts and rejects unexpected fields', () => {
  const draft = structuredClone(seed[0]);
  draft.id = 'draft';
  draft.slug = 'draft';
  draft.published = false;
  draft.references.forEach((ref) => {
    ref.images = [];
  });
  const result = publicCatalog([...seed, draft]);
  assert.equal(result.length, 1);
  assert.equal(result[0].published, undefined);
  assert.equal(result[0].createdAt, undefined);
  assert.throws(() => publicCatalog([{ ...seed[0], privateNote: 'secret' }]));
});
test('missing location and reference without scan are valid local variants', () => {
  const value = structuredClone(seed);
  value[0].location = { coordinates: null, precision: 'unknown', explanation: null };
  const result = publicCatalog(value);
  assert.equal(result[0].location.coordinates, null);
  assert.deepEqual(result[0].references[0].images, []);
});
