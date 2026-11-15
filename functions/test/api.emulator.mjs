import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { createPlace, readLocations, updateLocation, updatePlace } from '../src/service.mjs';
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
const [fixture] = JSON.parse(
  readFileSync(new URL('../../data/places.fixture.json', import.meta.url)),
);
const {
  id: _id,
  createdAt: _createdAt,
  published: _published,
  locationVersion: _locationVersion,
  updatedAt: _updatedAt,
  ...fixtureContent
} = fixture;
const placeContent = {
  ...fixtureContent,
  slug: 'test-editor-place',
  previousSlugs: [],
  mentions: fixtureContent.mentions.map((mention) => ({ ...mention, materials: [] })),
  location: {
    ...fixtureContent.location,
    coordinates: { lat: 50.098064, lng: 18.54965 },
  },
};
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
await test('place creation and editing require admin, validate fields and prevent stale or duplicate writes', async () => {
  for (const overrides of [
    { app: undefined },
    { auth: undefined },
    { auth: { uid: 'user', token: { firebase: { sign_in_provider: 'google.com' } } } },
    {
      auth: {
        uid: 'user',
        token: { admin: true, firebase: { sign_in_provider: 'password' } },
      },
    },
  ])
    await assert.rejects(createPlace(db, request(placeContent, overrides)), (error) =>
      ['unauthenticated', 'permission-denied'].includes(error.code),
    );

  await assert.rejects(createPlace(db, request({ ...placeContent, published: false })), {
    code: 'invalid-argument',
  });

  const created = await createPlace(db, request(placeContent));
  assert.match(created.id, /^place_[a-f0-9]{32}$/);
  assert.equal(created.locationVersion, 0);
  assert.equal(created.slug, placeContent.slug);
  const stored = (await db.doc(`places/${created.id}`).get()).data();
  assert.equal(stored.published, true);
  assert.ok(stored.createdAt instanceof Timestamp);
  assert.ok(stored.updatedAt instanceof Timestamp);
  assert.ok(stored.location.coordinates instanceof GeoPoint);

  await assert.rejects(createPlace(db, request(placeContent)), { code: 'already-exists' });
  await assert.rejects(
    updatePlace(
      db,
      request(
        { placeId: created.id, expectedUpdatedAt: created.updatedAt, place: placeContent },
        {
          auth: { uid: 'regular', token: { firebase: { sign_in_provider: 'google.com' } } },
        },
      ),
    ),
    { code: 'permission-denied' },
  );

  await new Promise((resolve) => setTimeout(resolve, 10));
  const nextContent = {
    ...placeContent,
    description: `${placeContent.description} updated`,
    location: { ...placeContent.location, coordinates: { lat: 50.1, lng: 18.55 } },
  };
  const saved = await updatePlace(
    db,
    request({ placeId: created.id, expectedUpdatedAt: created.updatedAt, place: nextContent }),
  );
  assert.equal(saved.description, nextContent.description);
  assert.equal(saved.locationVersion, 1);
  await assert.rejects(
    updatePlace(
      db,
      request({ placeId: created.id, expectedUpdatedAt: created.updatedAt, place: placeContent }),
    ),
    { code: 'aborted' },
  );
  assert.equal((await db.doc(`places/${created.id}`).get()).data().locationVersion, 1);
});
after(() => deleteApp(app));
