// Local-only API. This entry point is never exported by Firebase Functions.
import express from 'express';
import { createRequire } from 'node:module';
import { Firestore } from '@google-cloud/firestore';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { Storage } from '@google-cloud/storage';
import { uploadCreatorMaterial } from './creator-material.mjs';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  listCreatorPlaces,
  createCreatorDraft,
  openCreatorDraft,
  deleteCreatorDraft,
  saveCreatorDraft,
  requireCreatorIdentity,
} from './creator.mjs';
import { authenticateLocal } from './creator-local-auth.mjs';
if (
  process.env.FIRESTORE_EMULATOR_HOST ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||
  process.env.K_SERVICE ||
  process.env.FUNCTION_TARGET
) {
  throw new Error(
    'Local creator requires the real dev database and must not run in a deployed function.',
  );
}
const projectId = 'historyczny-rybnik';
const options = { projectId, databaseId: 'places-dev' };
let storageAuthClient;
if (process.argv.includes('--firebase-cli')) {
  const requireRoot = createRequire(new URL('../../package.json', import.meta.url));
  const { getGlobalDefaultAccount } = requireRoot('firebase-tools/lib/auth');
  const { clientId, clientSecret } = requireRoot('firebase-tools/lib/api');
  const account = getGlobalDefaultAccount();
  if (!account) throw new Error('Sign in with firebase login first');
  const authClient = new OAuth2Client({ clientId: clientId(), clientSecret: clientSecret() });
  authClient.setCredentials({ refresh_token: account.tokens.refresh_token });
  storageAuthClient = authClient;
  options.auth = new GoogleAuth({ authClient, projectId });
}
const db = new Firestore(options);
const storage = new Storage({
  projectId,
  ...(storageAuthClient ? { authClient: storageAuthClient } : {}),
});
const bucket = storage.bucket('historyczny-rybnik-dev-files');
const auth = getAuth(initializeApp({ projectId }));
const app = express();
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (
    req.get('host') !== '127.0.0.1:5002' ||
    !['http://localhost:4200', 'http://localhost:4300'].includes(origin)
  )
    return res.status(403).end();
  res.set('Access-Control-Allow-Origin', origin);
  res.set(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Firebase-AppCheck, Authorization, Firebase-Instance-ID-Token',
  );
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json({ limit: '12mb' }));
const handlers = {
  placesDevCreatorList: listCreatorPlaces,
  placesDevCreatorCreate: createCreatorDraft,
  placesDevCreatorOpen: openCreatorDraft,
  placesDevCreatorDelete: deleteCreatorDraft,
  placesDevCreatorSave: saveCreatorDraft,
  placesDevCreatorUpload: (db, request) => uploadCreatorMaterial(db, bucket, request, true),
};
for (const [name, handler] of Object.entries(handlers)) {
  app.post('/historyczny-rybnik/europe-central2/' + name, async (req, res) => {
    try {
      const identity = await authenticateLocal(req.get('authorization'), (token) =>
        auth.verifyIdToken(token),
      );
      res.json({
        result: await handler(db, { data: req.body?.data, auth: identity }, requireCreatorIdentity),
      });
    } catch (error) {
      const codes = {
        unauthenticated: [401, 'UNAUTHENTICATED'],
        'permission-denied': [403, 'PERMISSION_DENIED'],
        'invalid-argument': [400, 'INVALID_ARGUMENT'],
        'not-found': [404, 'NOT_FOUND'],
        'failed-precondition': [400, 'FAILED_PRECONDITION'],
        'resource-exhausted': [429, 'RESOURCE_EXHAUSTED'],
      };
      const [status, code] = codes[error.code] ?? [500, 'INTERNAL'];
      res.status(status).json({
        error: {
          status: code,
          message: status === 500 ? 'Operacja nie powiodła się.' : error.message,
        },
      });
    }
  });
}
app.listen(5002, '127.0.0.1', () =>
  console.log('Local creator API: 127.0.0.1:5002; database: places-dev'),
);
