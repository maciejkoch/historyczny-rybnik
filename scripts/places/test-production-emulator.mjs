import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(process.cwd() + '/functions/package.json');
const { initializeApp, deleteApp } = require('firebase-admin/app');
const { getFirestore, GeoPoint, Timestamp } = require('firebase-admin/firestore');
const emulatorHost = process.env['FIRESTORE_EMULATOR_HOST'] ?? '';
if (!/^(localhost|127\.0\.0\.1):\d+$/.test(emulatorHost)) {
  throw new Error('A local Firestore emulator is required');
}
const app = initializeApp({ projectId: 'demo-historyczny-rybnik' });
const db = getFirestore(app, 'places-prod');
const [fixture] = JSON.parse(readFileSync('data/places.fixture.json', 'utf8'));
const { id, ...data } = fixture;
if (data.location.coordinates)
  data.location.coordinates = new GeoPoint(
    data.location.coordinates.lat,
    data.location.coordinates.lng,
  );
data.createdAt = Timestamp.fromDate(new Date(data.createdAt));
data.updatedAt = Timestamp.fromDate(new Date(data.updatedAt));
await db.doc(`places/${id}`).set(data);
const root = 'http://127.0.0.1:5001/demo-historyczny-rybnik/europe-central2/placesProdWeb';
const callableRoot = 'http://127.0.0.1:5001/demo-historyczny-rybnik/europe-central2';
for (const name of ['placesProdRead', 'placesProdUpdate']) {
  const response = await fetch(`${callableRoot}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { ids: [id] } }),
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error.status, 'UNAUTHENTICATED');
}
const list = await fetch(root + '/api/public-places');
assert.equal(list.status, 200);
const places = await list.json();
assert.equal(places.length, 1);
assert.equal(places[0].id, id);
const page = await fetch(root + '/miejsca/' + fixture.slug);
const html = await page.text();
assert.equal(page.status, 200);
assert.ok(html.includes(fixture.name));
assert.ok(html.includes('https://historyczny.rybnik.pl/miejsca/' + fixture.slug));
assert.doesNotMatch(html, /noindex|historyczny-rybnik-dev/);
const sitemap = await fetch(root + '/sitemap.xml');
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
assert.ok(xml.includes('https://historyczny.rybnik.pl/miejsca/' + fixture.slug));
assert.ok(xml.includes('https://historyczny.rybnik.pl/szukaj'));
assert.ok(xml.includes('https://historyczny.rybnik.pl/prywatnosc'));
assert.equal((await fetch(root + '/miejsca/does-not-exist')).status, 404);
await deleteApp(app);
console.log('Production Functions and SSR emulator test passed on synthetic data.');
