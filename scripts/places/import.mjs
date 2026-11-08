import { readFileSync } from 'node:fs';
import { preserveLiveFields } from './import-policy.mjs';
import { validateCatalog } from '../../functions/src/validation.mjs';
const input = process.argv.find((arg) => arg.endsWith('.json')) || 'data/places.test-data.json';
const places = validateCatalog(JSON.parse(readFileSync(input, 'utf8')));
if (
  !places.length ||
  places.length > 400 ||
  !places.some((p) => p.id === 'place_sw_antoni' && p.published)
)
  throw new Error('Dev import requires the reviewed church and 1–400 validated places');
console.log(
  JSON.stringify(
    places.map(({ id, slug, mentions }) => ({ id, slug, mentions: mentions.length })),
    null,
    2,
  ),
);
if (!process.argv.includes('--apply')) {
  console.log('Dry run. Add --apply with explicit GCLOUD_PROJECT and ADC to write.');
  process.exit(0);
}
const { database, GeoPoint, Timestamp } = await import('./firestore.mjs');
const db = await database('import');
await db.runTransaction(async (tx) => {
  const existing = await tx.get(db.collection('places'));
  if (existing.docs.some((doc) => !places.some((place) => place.id === doc.id)))
    throw new Error('Unexpected documents: refusing to change catalogue');
  for (const { id, ...place } of places) {
    const current = existing.docs.find((doc) => doc.id === id);
    const point = place.location.coordinates;
    // Reruns update editorial content but preserve live position/version/timestamps.
    const value = {
      ...place,
      location: {
        ...place.location,
        coordinates: point ? new GeoPoint(point.lat, point.lng) : null,
      },
      createdAt: Timestamp.fromDate(new Date(place.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(place.updatedAt)),
    };
    tx.set(db.collection('places').doc(id), preserveLiveFields(value, current?.data()));
  }
});
console.log(`Imported ${places.length} places; live locations preserved.`);
