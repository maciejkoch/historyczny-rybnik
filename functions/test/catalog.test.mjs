import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicCatalog } from '../../scripts/places/catalog.mjs';
const seed = JSON.parse(readFileSync(new URL('../../data/places.seed.json', import.meta.url)));
test('SSG excludes drafts and rejects unexpected fields', () => {
  const draft = structuredClone(seed[0]);
  draft.id = 'draft';
  draft.slug = 'draft';
  draft.published = false;
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
