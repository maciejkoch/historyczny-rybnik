import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { readLocations } from '../src/service.mjs';
const app = initializeApp({ projectId: 'demo-historyczny-rybnik' });
const db = getFirestore(app, 'places-dev');
const location = {
  coordinates: { lat: 50.098064, lng: 18.54965 },
  precision: 'approximate',
  explanation: 'Test location',
};
const auth = {
  uid: 'test-user',
  token: { admin: true, firebase: { sign_in_provider: 'google.com' } },
};
const request = (data, extra = {}) => ({ app: { appId: 'test' }, auth, data, ...extra });
await db.doc('places/public').set({
  published: true,
  location: { ...location, coordinates: new GeoPoint(50, 18) },
  updatedAt: Timestamp.now(),
  privateNote: 'never expose',
});
await db.doc('places/draft').set({ published: false });
await test('App Check is mandatory', async () => {
  await assert.rejects(readLocations(db, request({ ids: ['public'] }, { app: undefined })), {
    code: 'unauthenticated',
  });
});
await test('public projection excludes draft and private fields', async () => {
  const result = await readLocations(db, request({ ids: ['public', 'draft', 'missing'] }));
  assert.equal(result.places.length, 1);
  assert.deepEqual(Object.keys(result.places[0]).sort(), ['id', 'location', 'updatedAt']);
});
after(() => deleteApp(app));
