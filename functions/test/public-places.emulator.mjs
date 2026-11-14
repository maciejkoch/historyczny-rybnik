import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore';
import { readPublicPlace, readPublicSummaries } from '../src/public-places.mjs';

const app = initializeApp({ projectId: 'demo-historyczny-rybnik' }, 'public-places-test');
const db = getFirestore(app, 'public-places-test');
const [fixture] = JSON.parse(readFileSync(new URL('../../data/places.fixture.json', import.meta.url)));
const { id, ...value } = structuredClone(fixture);
const point = value.location.coordinates;
value.location.coordinates = point ? new GeoPoint(point.lat, point.lng) : null;
value.createdAt = Timestamp.fromDate(new Date(value.createdAt));
value.updatedAt = Timestamp.fromDate(new Date(value.updatedAt));
value.previousSlugs = ['old-address'];
await db.collection('places').doc(id).set(value);
await db.collection('places').doc('hidden').set({ ...value, slug: 'hidden', previousSlugs: [], published: false });
after(() => deleteApp(app));

await test('real Firestore queries return current public data only', async () => {
  assert.equal((await readPublicSummaries(db)).length, 1);
  assert.equal((await readPublicPlace(db, 'old-address')).slug, value.slug);
  assert.equal(await readPublicPlace(db, 'hidden'), null);
  await db.collection('places').doc(id).update({ description: 'Zmieniony opis testowy' });
  assert.equal((await readPublicPlace(db, value.slug)).description, 'Zmieniony opis testowy');
});
