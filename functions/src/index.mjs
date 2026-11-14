import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { readLocations, updateLocation } from './service.mjs';
import { publicWeb } from './public-web.mjs';
initializeApp();
const db = getFirestore('places-dev');
const options = {
  region: 'europe-central2',
  serviceAccount: 'places-dev-api@historyczny-rybnik.iam.gserviceaccount.com',
  enforceAppCheck: true,
  maxInstances: 3,
  minInstances: 0,
  memory: '256MiB',
  timeoutSeconds: 30,
  cors: [
    'https://historyczny-rybnik-dev.web.app',
    ...[1, 2, 3].map((slot) => `https://historyczny-rybnik-dev-${slot}.web.app`),
    /^http:\/\/localhost(:\d+)?$/,
  ],
};
export const placesDevRead = onCall(options, (request) => readLocations(db, request));
export const placesDevUpdate = onCall(options, (request) => updateLocation(db, request));
export const placesDevWeb = onRequest({
  region: 'europe-central2',
  serviceAccount: 'places-dev-build@historyczny-rybnik.iam.gserviceaccount.com',
  maxInstances: 3,
  minInstances: 0,
  memory: '512MiB',
  timeoutSeconds: 30,
}, publicWeb(db, async (request, context) => {
  const { renderPlace } = await import('../ssr/server.mjs');
  return renderPlace(request, context);
}));
