import { isDeepStrictEqual } from 'node:util';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { requireApp } from './service.mjs';
import { creatorEmptyRequestSchema, creatorIdRequestSchema, creatorListResponseSchema, draftDataSchema, draftResponseSchema } from './contracts/creator.mjs';

const fields = ['name', 'slug', 'description', 'tags', 'documentedPeriod', 'existsToday', 'historicalAddress', 'location', 'mentions', 'materials'];
function authorize(request) {
  requireApp(request);
  if (!request.auth || request.auth.token.firebase?.sign_in_provider !== 'google.com') throw new HttpsError('unauthenticated', 'Google authentication required');
  if (request.auth.token.admin !== true) throw new HttpsError('permission-denied', 'Administrator role required');
}
function validate(schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid request');
  return parsed.data;
}
function data(value) {
  const result = Object.fromEntries(fields.filter((field) => value[field] !== undefined).map((field) => [field, value[field]]));
  const point = result.location?.coordinates;
  if (point && typeof point.latitude === 'number' && typeof point.longitude === 'number')
    result.location = { ...result.location, coordinates: { lat: point.latitude, lng: point.longitude } };
  return draftDataSchema.parse(result);
}
function draftDto(snapshot) {
  const value = snapshot.data();
  return draftResponseSchema.parse({ id: snapshot.id, data: data(value), createdAt: value.createdAt.toDate().toISOString(), updatedAt: value.updatedAt.toDate().toISOString() });
}
export async function listCreatorPlaces(db, request, checkAccess = authorize) {
  checkAccess(request); validate(creatorEmptyRequestSchema, request.data);
  const [places, drafts] = await Promise.all([db.collection('places').where('published', '==', true).limit(1001).get(), db.collection('placeDrafts').limit(1001).get()]);
  if (places.size > 1000 || drafts.size > 1000) throw new HttpsError('resource-exhausted', 'Catalogue too large');
  const index = new Map(drafts.docs.map((doc) => [doc.id, doc]));
  const items = places.docs.map((place) => {
    const draft = index.get(place.id); index.delete(place.id);
    const published = data(place.data());
    const edited = draft && data(draft.data());
    return { id: place.id, name: edited?.name || published.name, status: edited && !isDeepStrictEqual(edited, published) ? 'modified' : 'published' };
  });
  for (const doc of index.values()) items.push({ id: doc.id, name: data(doc.data()).name ?? '', status: 'draft' });
  items.sort((a, b) => a.name.localeCompare(b.name, 'pl') || a.id.localeCompare(b.id));
  return creatorListResponseSchema.parse({ places: items });
}
export async function createCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request); validate(creatorEmptyRequestSchema, request.data);
  const ref = db.collection('placeDrafts').doc();
  await ref.create({ createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return draftDto(await ref.get());
}
export async function openCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request); const { id } = validate(creatorIdRequestSchema, request.data);
  const ref = db.collection('placeDrafts').doc(id), place = db.collection('places').doc(id);
  await db.runTransaction(async (tx) => {
    const [draft, published] = await Promise.all([tx.get(ref), tx.get(place)]);
    if (draft.exists) return;
    if (!published.exists || published.data().published !== true) throw new HttpsError('not-found', 'Place unavailable');
    data(published.data());
    const copy = Object.fromEntries(fields.map((field) => [field, published.data()[field]]));
    tx.create(ref, { ...copy, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  });
  const saved = await ref.get();
  if (!saved.exists) throw new HttpsError('not-found', 'Draft unavailable');
  return draftDto(saved);
}
export async function deleteCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request); const { id } = validate(creatorIdRequestSchema, request.data);
  const ref = db.collection('placeDrafts').doc(id), place = db.collection('places').doc(id);
  await db.runTransaction(async (tx) => {
    const [draft, published] = await Promise.all([tx.get(ref), tx.get(place)]);
    if (!draft.exists) throw new HttpsError('not-found', 'Draft unavailable');
    if (published.exists) throw new HttpsError('failed-precondition', 'Place cannot be deleted');
    tx.delete(ref);
  });
  return { ok: true };
}
