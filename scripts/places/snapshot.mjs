import { writeFileSync, mkdirSync } from 'node:fs';
import { validateCatalog } from '../../functions/src/validation.mjs';
import { database } from './firestore.mjs';
import { upgradePlace } from '../research/migrations/legacy-catalog.mjs';
const docs = await (
  await database('build')
)
  .collection('places')
  .where('published', '==', true)
  .get();
let places = docs.docs.map((doc) => {
  const p = doc.data();
  const c = p.location.coordinates;
  const record = {
    id: doc.id,
    ...p,
    location: { ...p.location, coordinates: c ? { lat: c.latitude, lng: c.longitude } : null },
    createdAt: p.createdAt.toDate().toISOString(),
    updatedAt: p.updatedAt.toDate().toISOString(),
  };
  return record;
});
if (process.argv.includes('--migrate-legacy')) {
  mkdirSync('.local', { recursive: true });
  const backup = `.local/places.before-research-${Date.now()}.json`;
  writeFileSync(backup, JSON.stringify(places, null, 2) + '\n', { flag: 'wx' });
  console.log(`Legacy backup: ${backup}`);
  places = places.map(upgradePlace);
}
// Strict validation rejects unknown/private fields rather than leaking them into artifacts.
validateCatalog(places);
mkdirSync('.local', { recursive: true });
writeFileSync('.local/places.snapshot.json', JSON.stringify(places));
console.log(
  'Snapshot: .local/places.snapshot.json. Build with PLACES_SNAPSHOT pointing to this file.',
);
