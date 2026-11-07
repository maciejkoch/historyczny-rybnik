import { HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, GeoPoint } from 'firebase-admin/firestore';
import { locationDtoSchema, readResponseSchema } from './contracts/places.mjs';
import { readRequest, writeRequest, ValidationError } from './validation.mjs';
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
function serverResponse(parse) {
  try {
    return parse();
  } catch {
    fail('internal', 'Invalid location data');
  }
}
export function requireApp(request) {
  if (!request.app) fail('unauthenticated', 'App Check required');
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
  requireApp(request);
  if (!request.auth || request.auth.token.firebase?.sign_in_provider !== 'google.com')
    fail('unauthenticated', 'Google authentication required');
  if (request.auth.token.admin !== true) fail('permission-denied', 'Administrator role required');
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
