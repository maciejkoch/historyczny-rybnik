import { z } from 'zod';
import { publicPlaceSchema, publicSummarySchema, placeSchema } from './contracts/places.mjs';

// Admin SDK bypasses Firestore rules, so the public projection is explicit and validated.
const summaryFields = ['name', 'slug', 'tags', 'historicalAddress', 'location', 'updatedAt'];
const summariesSchema = z
  .array(publicSummarySchema)
  .max(1000)
  .superRefine((places, ctx) => {
    for (const key of ['id', 'slug']) {
      if (new Set(places.map((place) => place[key])).size !== places.length)
        ctx.addIssue({ code: 'custom', message: `Duplicate ${key}` });
    }
  });
function location(value) {
  const point = value.coordinates;
  return { ...value, coordinates: point ? { lat: point.latitude, lng: point.longitude } : null };
}
function summary(snapshot) {
  const value = snapshot.data();
  return publicSummarySchema.parse({
    id: snapshot.id,
    ...value,
    location: location(value.location),
    updatedAt: value.updatedAt.toDate().toISOString(),
  });
}
function detail(snapshot) {
  const value = snapshot.data();
  const record = placeSchema.parse({
    ...value,
    id: snapshot.id,
    location: location(value.location),
    createdAt: value.createdAt.toDate().toISOString(),
    updatedAt: value.updatedAt.toDate().toISOString(),
  });
  if (!record.published) return null;
  const { published, createdAt, ...place } = record;
  return publicPlaceSchema.parse(place);
}

export async function readPublicSummaries(db) {
  const result = await db
    .collection('places')
    .where('published', '==', true)
    .select(...summaryFields)
    .limit(1001)
    .get();
  return summariesSchema.parse(result.docs.map(summary));
}

export async function readPublicPlace(db, slug) {
  if (typeof slug !== 'string' || slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    return null;
  const places = db.collection('places');
  const current = await places
    .where('published', '==', true)
    .where('slug', '==', slug)
    .limit(2)
    .get();
  if (current.docs.length > 1) throw new Error('Conflicting place slugs');
  return current.docs.length ? detail(current.docs[0]) : null;
}
