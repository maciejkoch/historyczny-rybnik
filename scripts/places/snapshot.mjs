import { writeFileSync, mkdirSync } from 'node:fs';
import { validateCatalog } from '../../functions/src/validation.mjs';
import { database } from './firestore.mjs';
const docs = await (
  await database('build')
)
  .collection('places')
  .where('published', '==', true)
  .get();
const places = docs.docs.map((doc) => {
  const p = doc.data();
  const c = p.location.coordinates;
  return {
    id: doc.id,
    ...p,
    location: { ...p.location, coordinates: c ? { lat: c.latitude, lng: c.longitude } : null },
    createdAt: p.createdAt.toDate().toISOString(),
    updatedAt: p.updatedAt.toDate().toISOString(),
  };
});
// Strict validation rejects unknown/private fields rather than leaking them into artifacts.
validateCatalog(places);
mkdirSync('.local', { recursive: true });
writeFileSync('.local/places.snapshot.json', JSON.stringify(places));
console.log(
  'Snapshot: .local/places.snapshot.json. Build with PLACES_SNAPSHOT pointing to this file.',
);
