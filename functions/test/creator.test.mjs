import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listCreatorPlaces, createCreatorDraft, openCreatorDraft, deleteCreatorDraft } from '../src/creator.mjs';
import { draftDataSchema, draftMaterialSchema, draftMentionSchema } from '../src/contracts/creator.mjs';
import { mentionSchema, placeMaterialSchema, placeSchema } from '../src/contracts/places.mjs';

const handlers = [listCreatorPlaces, createCreatorDraft, openCreatorDraft, deleteCreatorDraft];
test('all creator operations enforce App Check, Google authentication and administrator role', async () => {
  for (const handler of handlers) {
    await assert.rejects(handler(null, { data: {} }), { code: 'unauthenticated' });
    await assert.rejects(handler(null, { app: {}, data: {} }), { code: 'unauthenticated' });
    await assert.rejects(handler(null, { app: {}, auth: { token: { admin: true, firebase: { sign_in_provider: 'password' } } }, data: {} }), { code: 'unauthenticated' });
    await assert.rejects(handler(null, { app: {}, auth: { token: { firebase: { sign_in_provider: 'google.com' } } }, data: {} }), { code: 'permission-denied' });
  }
});
test('creator validates request before accessing Firestore', async () => {
  const auth = { app: {}, auth: { token: { admin: true, firebase: { sign_in_provider: 'google.com' } } }, data: { id: '../other' } };
  await assert.rejects(openCreatorDraft(null, auth), { code: 'invalid-argument' });
  await assert.rejects(deleteCreatorDraft(null, auth), { code: 'invalid-argument' });
  await assert.rejects(createCreatorDraft(null, auth), { code: 'invalid-argument' });
});
test('draft accepts empty required place fields but rejects unknown fields', () => {
  const draft = { name: '', slug: '', description: '', tags: [], documentedPeriod: null, existsToday: null, historicalAddress: null, location: { coordinates: null, precision: null, explanation: null }, mentions: [], materials: [] };
  assert.equal(draftDataSchema.safeParse(draft).success, true);
  assert.equal(draftDataSchema.safeParse({ ...draft, published: true }).success, false);
});

test('draft uses place, mention and material fields but accepts incomplete and unvalidated content', () => {
  assert.deepEqual(Object.keys(draftDataSchema.shape).sort(), Object.keys(placeSchema.shape).filter((key) => !['id', 'published', 'createdAt', 'updatedAt'].includes(key)).sort());
  assert.deepEqual(Object.keys(draftMentionSchema.shape).sort(), Object.keys(mentionSchema.shape).sort());
  assert.deepEqual(Object.keys(draftMaterialSchema.shape).sort(), Object.keys(placeMaterialSchema.shape).sort());
  for (const draft of [
    {},
    { name: null, slug: 'not a slug!', documentedPeriod: { from: 'niedokończona data' }, location: { coordinates: { lat: 999 } } },
    { tags: [{}], mentions: [{}, { title: '', sourceUrl: 'niedokończony link', materialIds: ['?'] }], materials: [{}, { width: -1, sha256: 'abc' }] },
  ]) assert.equal(draftDataSchema.safeParse(draft).success, true);
});

test('draft enforces types, allowed fields and resource limits', () => {
  for (const draft of [
    { name: 7 }, { mentions: [{ unknown: true }] }, { materials: [{ width: 'large' }] },
    { name: 'x'.repeat(201) }, { tags: Array.from({ length: 101 }, () => ({})) },
    { mentions: Array.from({ length: 71 }, () => ({ description: 'x'.repeat(10000) })) },
  ]) assert.equal(draftDataSchema.safeParse(draft).success, false);
});
