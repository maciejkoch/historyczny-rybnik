import test from 'node:test';
import assert from 'node:assert/strict';
import { draftPreview } from './draft-preview.ts';

test('empty and incomplete drafts can be displayed without changing their data', () => {
  const draft = { mentions: [{ description: 'Treść' }], location: { coordinates: { lat: 50 } } };
  const original = structuredClone(draft);
  const preview = draftPreview(draft);
  assert.equal(preview.name, 'Miejsce bez nazwy');
  assert.equal(preview.mentions[0].description, 'Treść');
  assert.equal(preview.location.coordinates, null);
  assert.deepEqual(draft, original);
});

test('saved materials, mention links, dates and location appear in the card', () => {
  const preview = draftPreview({
    name: 'Szkoła', documentedPeriod: { from: '1932' },
    location: { coordinates: { lat: 50, lng: 18 }, precision: 'approximate', explanation: 'Plan' },
    materials: [{ materialId: 'm', storagePath: 'image', thumbnailPath: 'thumb', width: 800, height: 600 }],
    mentions: [{ id: 'w', title: 'Wzmianka', materialIds: ['m'] }],
  });
  assert.equal(preview.name, 'Szkoła');
  assert.deepEqual(preview.documentedPeriod, { from: '1932', to: null });
  assert.equal(preview.location.precision, 'approximate');
  assert.equal(preview.location.explanation, 'Plan');
  assert.equal(preview.materials[0].materialId, preview.mentions[0].materialIds[0]);
});

test('incomplete images cannot break the gallery', () => {
  const preview = draftPreview({ materials: [{ storagePath: 'image' }] });
  assert.deepEqual(preview.materials, []);
});
