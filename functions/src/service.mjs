import { HttpsError } from 'firebase-functions/v2/https';
import { locationDtoSchema, readResponseSchema } from './contracts/places.mjs';
import { readRequest, ValidationError } from './validation.mjs';
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
