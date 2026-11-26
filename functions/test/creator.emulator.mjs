import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import {
  listCreatorPlaces,
  createCreatorDraft,
  openCreatorDraft,
  deleteCreatorDraft,
  saveCreatorDraft,
} from '../src/creator.mjs';

const app = initializeApp({ projectId: 'demo-historyczny-rybnik' }, 'creator-test');
const db = getFirestore(app, 'creator-test');
const auth = { uid: 'admin', token: { admin: true, firebase: { sign_in_provider: 'google.com' } } };
const req = (data = {}) => ({ data, auth, app: { appId: 'test' } });
const fixture = JSON.parse(
  readFileSync(new URL('../../data/places.fixture.json', import.meta.url), 'utf8'),
);
const source = Array.isArray(fixture) ? fixture[0] : fixture.places[0];
const { id, createdAt, updatedAt, ...place } = source;
const point = place.location.coordinates;
await db
  .doc('places/creator-public')
  .set({
    ...place,
    published: true,
    location: { ...place.location, coordinates: point ? new GeoPoint(point.lat, point.lng) : null },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
await test('concurrent open yields one shared copy and cannot remove published place', async () => {
  const [first, second] = await Promise.all([
    openCreatorDraft(db, req({ id: 'creator-public' })),
    openCreatorDraft(db, req({ id: 'creator-public' })),
  ]);
  assert.equal(first.id, second.id);
  assert.deepEqual(first.data, second.data);
  const list = await listCreatorPlaces(db, req());
  assert.equal(list.places.find((item) => item.id === 'creator-public').status, 'published');
  await assert.rejects(deleteCreatorDraft(db, req({ id: 'creator-public' })), {
    code: 'failed-precondition',
  });
  assert.equal((await db.doc('places/creator-public').get()).exists, true);
});
await test('create, list, reopen and delete a new draft', async () => {
  const draft = await createCreatorDraft(db, req());
  assert.deepEqual(draft.data, {});
  await db
    .doc(`placeDrafts/${draft.id}`)
    .update({
      mentions: [{}, { title: '', sourceUrl: 'niedokończony link' }],
      materials: [{}],
      location: { coordinates: { lat: 1234 } },
    });
  assert.equal((await openCreatorDraft(db, req({ id: draft.id }))).id, draft.id);
  assert.equal(
    (await listCreatorPlaces(db, req())).places.find((item) => item.id === draft.id).status,
    'draft',
  );
  await deleteCreatorDraft(db, req({ id: draft.id }));
  assert.equal((await db.doc(`placeDrafts/${draft.id}`).get()).exists, false);
});
await test('whole draft save validates access and data, preserves unrelated fields and public place', async () => {
  const draft = await createCreatorDraft(db, req());
  const data = {
    name: 'Próba',
    existsToday: true,
    mentions: [{ title: 'Źródło' }],
    materials: [{}],
    location: { explanation: 'test' },
  };
  await assert.rejects(
    saveCreatorDraft(db, { data: { id: draft.id, data }, auth: null, app: { appId: 'test' } }),
    { code: 'unauthenticated' },
  );
  await assert.rejects(
    saveCreatorDraft(db, {
      data: { id: draft.id, data },
      auth: { ...auth, token: { ...auth.token, admin: false } },
      app: { appId: 'test' },
    }),
    { code: 'permission-denied' },
  );
  await assert.rejects(saveCreatorDraft(db, { data: { id: draft.id, data }, auth }), {
    code: 'unauthenticated',
  });
  await assert.rejects(
    saveCreatorDraft(db, req({ id: draft.id, data: { ...data, extra: true } })),
    { code: 'invalid-argument' },
  );
  await saveCreatorDraft(db, req({ id: draft.id, data }));
  assert.deepEqual((await openCreatorDraft(db, req({ id: draft.id }))).data, data);
  assert.equal((await db.doc(`places/${draft.id}`).get()).exists, false);
  await deleteCreatorDraft(db, req({ id: draft.id }));
  await assert.rejects(saveCreatorDraft(db, req({ id: draft.id, data })), { code: 'not-found' });
});
after(() => deleteApp(app));
