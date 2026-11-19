import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, onRequest } from 'firebase-functions/v2/https';
import { readLocations, updateLocation } from './service.mjs';
import { publicWeb } from './public-web.mjs';

initializeApp();
const db = getFirestore('places-prod');
const options = {
  region: 'europe-central2',
  serviceAccount: 'places-prod-api@historyczny-rybnik.iam.gserviceaccount.com',
  enforceAppCheck: true,
  maxInstances: 3,
  minInstances: 0,
  memory: '256MiB',
  timeoutSeconds: 30,
  cors: ['https://historyczny.rybnik.pl'],
};
export const placesProdRead = onCall(options, (request) => readLocations(db, request));
export const placesProdUpdate = onCall(options, (request) => updateLocation(db, request));
const webOptions = {
  region: 'europe-central2',
  serviceAccount: 'places-prod-build@historyczny-rybnik.iam.gserviceaccount.com',
  maxInstances: 3,
  minInstances: 0,
  memory: '512MiB',
  timeoutSeconds: 30,
};
const render = async (request, context) => {
  const bundle = await import('../ssr/server.mjs');
  return bundle.renderPlace(request, context);
};
export const placesProdWeb = onRequest(
  webOptions,
  publicWeb(db, render, { origin: 'https://historyczny.rybnik.pl', indexable: true }),
);
