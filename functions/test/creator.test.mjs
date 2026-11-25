import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listCreatorPlaces, createCreatorDraft, openCreatorDraft, deleteCreatorDraft } from '../src/creator.mjs';
import { draftDataSchema } from '../src/contracts/creator.mjs';

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
