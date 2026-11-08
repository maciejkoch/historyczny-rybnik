import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  validateCatalog,
  partialDate,
  timestamp,
  writeRequest,
  readRequest,
} from '../src/validation.mjs';
const testData = JSON.parse(readFileSync(new URL('../../data/places.test-data.json', import.meta.url)));
test('reviewed single church validates', () => assert.equal(validateCatalog(testData).length, 1));
test('image provenance rejects invalid URLs, hashes, rights dates and unknown fields', () => {
  const mutations = [
    (image) => (image.provenance.sourcePageUrl = 'http://example.org/source'),
    (image) => (image.provenance.licenseUrl = 'javascript:alert(1)'),
    (image) => (image.provenance.originalSha256 = 'not-a-hash'),
    (image) => (image.sha256 = 'a'.repeat(63)),
    (image) => (image.thumbnailSha256 = 'g'.repeat(64)),
    (image) => (image.provenance.rightsCheckedAt = '2026-02-30'),
    (image) => (image.provenance.rightsCheckedAt = '2026-11'),
    (image) => (image.provenance.copyrighted = 'False'),
    (image) => (image.provenance.privateNote = 'secret'),
    (image) => delete image.provenance,
  ];
  for (const mutate of mutations) {
    const data = structuredClone(testData);
    const image = data[0].mentions.find((ref) => ref.materials.length).materials[0];
    mutate(image);
    assert.throws(() => validateCatalog(data));
  }
});
test('calendar and partial dates retain precision', () => {
  for (const from of ['1932', '1932-02', '1932-02-29'])
    partialDate({ from, to: null, approximate: false });
  for (const from of ['1931-02-29', '1932-13', '1932-04-31', '1932-00'])
    assert.throws(() => partialDate({ from, to: null, approximate: false }));
  assert.throws(() => partialDate({ from: '1940', to: '1932', approximate: false }));
});
test('reject unknown fields, invalid paths, oversized document, collisions', () => {
  for (const mutate of [
    (p) => (p.private = 'secret'),
    (p) => (p.description = 'x'.repeat(20001)),
    (p) => (p.mentions[0].url = 'javascript:alert(1)'),
    (p) => p.previousSlugs.push(p.slug),
  ]) {
    const data = structuredClone(testData);
    mutate(data[0]);
    assert.throws(() => validateCatalog(data));
  }
});
test('bounded read and strict write DTO, no removal', () => {
  assert.deepEqual(readRequest({ ids: ['a'] }), ['a']);
  for (const data of [
    { ids: [] },
    { ids: ['a', 'a'] },
    { ids: ['../x'] },
    { ids: ['a'], published: false },
  ])
    assert.throws(() => readRequest(data));
  const value = { placeId: 'a', expectedLocationVersion: 0, location: testData[0].location };
  writeRequest(value);
  for (const data of [
    { ...value, published: true },
    { ...value, expectedLocationVersion: -1 },
    { ...value, location: { coordinates: null, precision: 'unknown', explanation: 'remove' } },
    { ...value, location: { ...value.location, coordinates: { lat: 91, lng: 0 } } },
  ])
    assert.throws(() => writeRequest(data));
});

test('technical timestamps reject invalid calendar dates and missing timezone', () => {
  timestamp('2026-11-05T12:00:00Z');
  for (const value of ['2026-02-30T12:00:00Z', '2026-11-05', '2026-11-05T12:00:00'])
    assert.throws(() => timestamp(value));
});
