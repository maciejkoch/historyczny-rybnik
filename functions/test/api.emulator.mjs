import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { readLocations, updateLocation } from '../src/service.mjs';
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
  locationVersion: 0,
  updatedAt: Timestamp.now(),
  privateNote: 'never expose',
});
await db.doc('places/draft').set({ published: false });
await test('App Check and Google Auth mandatory', async () => {
  for (const overrides of [
    { app: undefined },
    { auth: undefined },
    { auth: { uid: 'x', token: { admin: true, firebase: { sign_in_provider: 'password' } } } },
  ])
    await assert.rejects(
      updateLocation(
        db,
        request({ placeId: 'public', expectedLocationVersion: 0, location }, overrides),
      ),
      { code: 'unauthenticated' },
    );
  await assert.rejects(readLocations(db, request({ ids: ['public'] }, { app: undefined })), {
    code: 'unauthenticated',
  });
});
await test('regular Google user cannot write', async () => {
  await assert.rejects(
    updateLocation(
      db,
      request(
        { placeId: 'public', expectedLocationVersion: 0, location },
        { auth: { uid: 'regular', token: { firebase: { sign_in_provider: 'google.com' } } } },
      ),
    ),
    { code: 'permission-denied' },
  );
});
await test('public projection excludes draft and private fields', async () => {
  const result = await readLocations(db, request({ ids: ['public', 'draft', 'missing'] }));
  assert.equal(result.places.length, 1);
  assert.deepEqual(Object.keys(result.places[0]).sort(), [
    'id',
    'location',
    'locationVersion',
    'updatedAt',
  ]);
});
await test('draft, missing, forbidden fields and removal rejected', async () => {
  for (const placeId of ['draft', 'missing'])
    await assert.rejects(
      updateLocation(db, request({ placeId, expectedLocationVersion: 0, location })),
      { code: 'not-found' },
    );
  for (const data of [
    { placeId: 'public', expectedLocationVersion: 0, location, published: true },
    {
      placeId: 'public',
      expectedLocationVersion: 0,
      location: { coordinates: null, precision: 'unknown', explanation: 'remove' },
    },
  ])
    await assert.rejects(updateLocation(db, request(data)), { code: 'invalid-argument' });
});
await test('exactly one concurrent save commits; no history or author', async () => {
  const data = { placeId: 'public', expectedLocationVersion: 0, location };
  const results = await Promise.allSettled([
    updateLocation(db, request(data)),
    updateLocation(
      db,
      request({ ...data, location: { ...location, coordinates: { lat: 51, lng: 19 } } }),
    ),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.find((r) => r.status === 'rejected').reason.code, 'aborted');
  const value = (await db.doc('places/public').get()).data();
  assert.equal(value.locationVersion, 1);
  assert.ok(value.updatedAt instanceof Timestamp);
  assert.equal(value.author, undefined);
  assert.deepEqual(await db.doc('places/public').listCollections(), []);
});
await test('optional comment replaces previous text and can be cleared', async () => {
  const previous = (await db.doc('places/public').get()).data();
  const saved = await updateLocation(
    db,
    request({
      placeId: 'public',
      expectedLocationVersion: previous.locationVersion,
      location: { ...location, explanation: '' },
    }),
  );
  assert.equal(saved.location.explanation, '');
  assert.equal((await db.doc('places/public').get()).data().location.explanation, '');
});
after(() => deleteApp(app));
