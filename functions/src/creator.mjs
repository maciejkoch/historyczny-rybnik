import { isDeepStrictEqual } from 'node:util';
import { FieldValue, GeoPoint } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { requireApp } from './service.mjs';
import { publicationCandidate, validatePublication } from './contracts/publication.mjs';
import {
  creatorEmptyRequestSchema,
  creatorIdRequestSchema,
  creatorListResponseSchema,
  creatorSaveRequestSchema,
  draftDataSchema,
  draftResponseSchema,
} from './contracts/creator.mjs';

const fields = [
  'name',
  'slug',
  'description',
  'tags',
  'documentedPeriod',
  'existsToday',
  'historicalAddress',
  'location',
  'mentions',
  'materials',
];
export function requireCreatorIdentity(request) {
  if (!request.auth || request.auth.token.firebase?.sign_in_provider !== 'google.com')
    throw new HttpsError('unauthenticated', 'Google authentication required');
  if (request.auth.token.admin !== true)
    throw new HttpsError('permission-denied', 'Administrator role required');
}
function authorize(request) {
  requireApp(request);
  requireCreatorIdentity(request);
}
function validate(schema, value) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new HttpsError('invalid-argument', 'Invalid request');
  return parsed.data;
}
function data(value) {
  const result = Object.fromEntries(
    fields.filter((field) => value[field] !== undefined).map((field) => [field, value[field]]),
  );
  const point = result.location?.coordinates;
  if (point && typeof point.latitude === 'number' && typeof point.longitude === 'number')
    result.location = {
      ...result.location,
      coordinates: { lat: point.latitude, lng: point.longitude },
    };
  return draftDataSchema.parse(result);
}
function draftDto(snapshot) {
  const value = snapshot.data();
  return draftResponseSchema.parse({
    id: snapshot.id,
    data: data(value),
    createdAt: value.createdAt.toDate().toISOString(),
    updatedAt: value.updatedAt.toDate().toISOString(),
  });
}
export async function listCreatorPlaces(db, request, checkAccess = authorize) {
  checkAccess(request);
  validate(creatorEmptyRequestSchema, request.data);
  const [places, drafts] = await Promise.all([
    db.collection('places').where('published', '==', true).limit(1001).get(),
    db.collection('placeDrafts').limit(1001).get(),
  ]);
  if (places.size > 1000 || drafts.size > 1000)
    throw new HttpsError('resource-exhausted', 'Catalogue too large');
  const index = new Map(drafts.docs.map((doc) => [doc.id, doc]));
  const items = places.docs.map((place) => {
    const draft = index.get(place.id);
    index.delete(place.id);
    const published = data(place.data());
    const edited = draft && data(draft.data());
    const normalized = (value) =>
      publicationCandidate(place.id, value, '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z');
    return {
      id: place.id,
      name: edited?.name || published.name,
      tagId: (edited?.tags ?? published.tags)?.[0]?.id || null,
      status:
        edited && !isDeepStrictEqual(normalized(edited), normalized(published))
          ? 'modified'
          : 'published',
    };
  });
  for (const doc of index.values()) {
    const draft = data(doc.data());
    items.push({
      id: doc.id,
      name: draft.name ?? '',
      tagId: draft.tags?.[0]?.id || null,
      status: 'draft',
    });
  }
  items.sort((a, b) => a.name.localeCompare(b.name, 'pl') || a.id.localeCompare(b.id));
  return creatorListResponseSchema.parse({ places: items });
}
export async function createCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request);
  validate(creatorEmptyRequestSchema, request.data);
  const ref = db.collection('placeDrafts').doc();
  await ref.create({
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return draftDto(await ref.get());
}
export async function openCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request);
  const { id } = validate(creatorIdRequestSchema, request.data);
  const ref = db.collection('placeDrafts').doc(id),
    place = db.collection('places').doc(id);
  await db.runTransaction(async (tx) => {
    const [draft, published] = await Promise.all([tx.get(ref), tx.get(place)]);
    if (draft.exists) return;
    if (!published.exists || published.data().published !== true)
      throw new HttpsError('not-found', 'Place unavailable');
    data(published.data());
    const copy = Object.fromEntries(fields.map((field) => [field, published.data()[field]]));
    tx.create(ref, {
      ...copy,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  const saved = await ref.get();
  if (!saved.exists) throw new HttpsError('not-found', 'Draft unavailable');
  return draftDto(saved);
}
export async function deleteCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request);
  const { id } = validate(creatorIdRequestSchema, request.data);
  const ref = db.collection('placeDrafts').doc(id),
    place = db.collection('places').doc(id);
  await db.runTransaction(async (tx) => {
    const [draft, published] = await Promise.all([tx.get(ref), tx.get(place)]);
    if (!draft.exists) throw new HttpsError('not-found', 'Draft unavailable');
    if (published.exists && published.data().published === true)
      throw new HttpsError('failed-precondition', 'Place cannot be deleted');
    if (published.exists) tx.delete(place);
    tx.delete(ref);
  });
  return { ok: true };
}

export async function saveCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request);
  const { id, data: content } = validate(creatorSaveRequestSchema, request.data);
  const ref = db.collection('placeDrafts').doc(id);
  await db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (!current.exists) throw new HttpsError('not-found', 'Draft unavailable');
    tx.set(ref, {
      ...content,
      createdAt: current.data().createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
}

export async function validateCreatorPublication(db, request, checkAccess = authorize) {
  checkAccess(request);
  const { id, data: expected } = validate(creatorSaveRequestSchema, request.data);
  const [draft, current] = await Promise.all([
    db.collection('placeDrafts').doc(id).get(),
    db.collection('places').doc(id).get(),
  ]);
  if (!draft.exists || !isDeepStrictEqual(data(draft.data()), expected))
    throw new HttpsError('failed-precondition', 'Draft changed');
  const now = new Date().toISOString();
  const result = validatePublication(id, expected, now, now);
  if (!result.success)
    return {
      ok: false,
      issues: result.error.issues.map((issue) => ({
        path: issue.path.map(String),
        code: issue.code,
      })),
    };
  const slug = result.data.slug;
  if (current.exists && current.data().slug !== slug)
    return { ok: false, issues: [{ path: ['slug'], code: 'slug_changed' }] };
  const matches = await db.collection('places').where('slug', '==', slug).limit(2).get();
  if (matches.docs.some((doc) => doc.id !== id))
    return { ok: false, issues: [{ path: ['slug'], code: 'slug_taken' }] };
  return { ok: true, issues: [] };
}
export async function publishCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request);
  const { id, data: expected } = validate(creatorSaveRequestSchema, request.data);
  const draftRef = db.collection('placeDrafts').doc(id);
  const placeRef = db.collection('places').doc(id);
  return db.runTransaction(async (tx) => {
    const [draft, current] = await Promise.all([tx.get(draftRef), tx.get(placeRef)]);
    if (!draft.exists) throw new HttpsError('not-found', 'Draft unavailable');
    if (!isDeepStrictEqual(data(draft.data()), expected))
      throw new HttpsError('failed-precondition', 'Draft changed');
    const now = new Date().toISOString();
    const result = validatePublication(id, data(draft.data()), now, now);
    if (!result.success)
      return {
        ok: false,
        issues: result.error.issues.map((issue) => ({
          path: issue.path.map(String),
          code: issue.code,
        })),
      };
    const value = result.data;
    if (current.exists && current.data().slug !== value.slug)
      return { ok: false, issues: [{ path: ['slug'], code: 'slug_changed' }] };
    const matches = await tx.get(db.collection('places').where('slug', '==', value.slug).limit(2));
    if (matches.docs.some((doc) => doc.id !== id))
      return { ok: false, issues: [{ path: ['slug'], code: 'slug_taken' }] };
    const { id: _id, ...record } = value;
    tx.set(placeRef, {
      ...record,
      location: {
        ...value.location,
        coordinates: value.location.coordinates
          ? new GeoPoint(value.location.coordinates.lat, value.location.coordinates.lng)
          : null,
      },
      createdAt: current.exists ? current.data().createdAt : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, issues: [] };
  });
}
export async function restoreCreatorDraft(db, request, checkAccess = authorize) {
  checkAccess(request);
  const { id } = validate(creatorIdRequestSchema, request.data);
  const draftRef = db.collection('placeDrafts').doc(id),
    placeRef = db.collection('places').doc(id);
  await db.runTransaction(async (tx) => {
    const [draft, place] = await Promise.all([tx.get(draftRef), tx.get(placeRef)]);
    if (!draft.exists || !place.exists || place.data().published !== true)
      throw new HttpsError('failed-precondition', 'Published place unavailable');
    const content = data(place.data());
    const coordinates = place.data().location.coordinates;
    tx.set(draftRef, {
      ...content,
      location: { ...content.location, coordinates },
      createdAt: draft.data().createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
}
export async function unpublishCreatorPlace(db, request, checkAccess = authorize) {
  checkAccess(request);
  const { id } = validate(creatorIdRequestSchema, request.data);
  const draftRef = db.collection('placeDrafts').doc(id),
    placeRef = db.collection('places').doc(id);
  await db.runTransaction(async (tx) => {
    const [draft, place] = await Promise.all([tx.get(draftRef), tx.get(placeRef)]);
    if (!draft.exists || !place.exists || place.data().published !== true)
      throw new HttpsError('failed-precondition', 'Published place unavailable');
    tx.update(placeRef, { published: false, updatedAt: FieldValue.serverTimestamp() });
  });
  return { ok: true };
}
