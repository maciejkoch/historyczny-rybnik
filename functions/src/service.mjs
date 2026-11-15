import { HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, GeoPoint } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { locationDtoSchema, readResponseSchema, publicPlaceSchema } from './contracts/places.mjs';
import {
  readRequest,
  writeRequest,
  createPlaceRequest,
  updatePlaceRequest,
  ValidationError,
} from './validation.mjs';
const fail = (code, message) => {
  throw new HttpsError(code, message);
};
function validate(fn, data) {
  try {
    return fn(data);
  } catch (error) {
    if (error instanceof ValidationError)
      throw new HttpsError('invalid-argument', 'Invalid request', {
        issues: error.issues.map(({ path, code }) => ({ path, code })),
      });
    throw error;
  }
}
async function serverResponse(parse, message = 'Invalid location data') {
  try {
    return await parse();
  } catch {
    fail('internal', message);
  }
}
export function requireApp(request) {
  if (!request.app) fail('unauthenticated', 'App Check required');
}
function requireEditor(request) {
  requireApp(request);
  if (!request.auth || request.auth.token.firebase?.sign_in_provider !== 'google.com')
    fail('unauthenticated', 'Google authentication required');
  if (request.auth.token.admin !== true) fail('permission-denied', 'Administrator role required');
}
export function locationDto(snapshot) {
  const value = snapshot.data();
  const point = value.location.coordinates;
  return locationDtoSchema.parse({
    id: snapshot.id,
    location: {
      coordinates: point ? { lat: point.latitude, lng: point.longitude } : null,
      precision: value.location.precision,
      explanation: value.location.explanation,
    },
    locationVersion: value.locationVersion,
    updatedAt: value.updatedAt.toDate().toISOString(),
  });
}
export async function readLocations(db, request) {
  requireApp(request);
  const ids = validate(readRequest, request.data);
  const docs = await db.getAll(...ids.map((id) => db.collection('places').doc(id)));
  return serverResponse(() =>
    readResponseSchema.parse({
      places: docs.filter((doc) => doc.exists && doc.data().published === true).map(locationDto),
    }),
  );
}
export async function updateLocation(db, request) {
  requireEditor(request);
  const data = validate(writeRequest, request.data);
  const ref = db.collection('places').doc(data.placeId);
  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists || snapshot.data().published !== true)
      fail('not-found', 'Place unavailable');
    const current = snapshot.data();
    if (current.locationVersion !== data.expectedLocationVersion)
      fail('aborted', 'Location changed. Read current version before saving.');
    tx.update(ref, {
      location: {
        ...data.location,
        coordinates: new GeoPoint(data.location.coordinates.lat, data.location.coordinates.lng),
      },
      locationVersion: current.locationVersion + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  // A later concurrent edit may already be visible: this is current state, not a request receipt.
  const saved = await ref.get();
  return serverResponse(() => locationDto(saved));
}

function storedPlace(place) {
  return {
    ...place,
    location: {
      ...place.location,
      coordinates: place.location.coordinates
        ? new GeoPoint(place.location.coordinates.lat, place.location.coordinates.lng)
        : null,
    },
  };
}

function placeDto(snapshot) {
  const value = snapshot.data();
  const point = value.location.coordinates;
  const { published: _published, createdAt: _createdAt, ...content } = value;
  return publicPlaceSchema.parse({
    ...content,
    id: snapshot.id,
    location: {
      ...value.location,
      coordinates: point ? { lat: point.latitude, lng: point.longitude } : null,
    },
    updatedAt: value.updatedAt.toDate().toISOString(),
  });
}

async function ensureUniqueSlugs(tx, db, place, excludedId = '') {
  const requested = new Set([place.slug, ...place.previousSlugs]);
  const values = [...requested];
  const queries = [];
  for (let offset = 0; offset < values.length; offset += 30) {
    const chunk = values.slice(offset, offset + 30);
    queries.push(db.collection('places').where('slug', 'in', chunk));
    queries.push(db.collection('places').where('previousSlugs', 'array-contains-any', chunk));
  }
  const snapshots = await Promise.all(queries.map((query) => tx.get(query)));
  for (const result of snapshots) {
    for (const snapshot of result.docs) {
      if (snapshot.id === excludedId) continue;
      fail('already-exists', 'A place with this slug already exists');
    }
  }
}

export async function createPlace(db, request) {
  requireEditor(request);
  const place = validate(createPlaceRequest, request.data);
  const id = `place_${randomUUID().replaceAll('-', '')}`;
  const validated = validate((value) => publicPlaceSchema.parse(value), {
    ...place,
    id,
    locationVersion: 0,
    updatedAt: new Date().toISOString(),
  });
  const ref = db.collection('places').doc(id);
  await db.runTransaction(async (tx) => {
    await ensureUniqueSlugs(tx, db, place);
    const timestamp = FieldValue.serverTimestamp();
    tx.create(ref, {
      ...storedPlace(validated),
      published: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      locationVersion: 0,
    });
  });
  return serverResponse(async () => placeDto(await ref.get()), 'Invalid place data');
}

export async function updatePlace(db, request) {
  requireEditor(request);
  const data = validate(updatePlaceRequest, request.data);
  const ref = db.collection('places').doc(data.placeId);
  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists || snapshot.data().published !== true)
      fail('not-found', 'Place unavailable');
    const current = snapshot.data();
    if (current.updatedAt.toDate().toISOString() !== data.expectedUpdatedAt)
      fail('aborted', 'Place changed. Read current data before saving.');
    await ensureUniqueSlugs(tx, db, data.place, data.placeId);
    const previousPoint = current.location.coordinates;
    const nextPoint = data.place.location.coordinates;
    const locationChanged =
      (previousPoint?.latitude ?? null) !== (nextPoint?.lat ?? null) ||
      (previousPoint?.longitude ?? null) !== (nextPoint?.lng ?? null) ||
      current.location.precision !== data.place.location.precision ||
      current.location.explanation !== data.place.location.explanation;
    const validated = validate((value) => publicPlaceSchema.parse(value), {
      ...data.place,
      id: data.placeId,
      locationVersion: current.locationVersion + Number(locationChanged),
      updatedAt: current.updatedAt.toDate().toISOString(),
    });
    tx.update(ref, {
      ...storedPlace(validated),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return serverResponse(async () => placeDto(await ref.get()), 'Invalid place data');
}
