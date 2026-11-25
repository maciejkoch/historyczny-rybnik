// Local-only API. This entry point is never exported by Firebase Functions.
import express from 'express';
import { createRequire } from 'node:module';
import { Firestore } from '@google-cloud/firestore';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { listCreatorPlaces, createCreatorDraft, openCreatorDraft, deleteCreatorDraft } from './creator.mjs';
if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.K_SERVICE || process.env.FUNCTION_TARGET) {
  throw new Error('Local creator requires the real dev database and must not run in a deployed function.');
}
const projectId = 'historyczny-rybnik';
const options = { projectId, databaseId: 'places-dev' };
if (process.argv.includes('--firebase-cli')) {
  const requireRoot = createRequire(new URL('../../package.json', import.meta.url));
  const { getGlobalDefaultAccount } = requireRoot('firebase-tools/lib/auth');
  const { clientId, clientSecret } = requireRoot('firebase-tools/lib/api');
  const account = getGlobalDefaultAccount();
  if (!account) throw new Error('Sign in with firebase login first');
  const authClient = new OAuth2Client({ clientId: clientId(), clientSecret: clientSecret() });
  authClient.setCredentials({ refresh_token: account.tokens.refresh_token });
  options.auth = new GoogleAuth({ authClient, projectId });
}
const db = new Firestore(options);
const app = express();
const localAccess = () => {};
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (req.get('host') !== '127.0.0.1:5002' || origin !== 'http://localhost:4200') return res.status(403).end();
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Firebase-AppCheck, Authorization, Firebase-Instance-ID-Token');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json({ limit: '1mb' }));
const handlers = { placesDevCreatorList: listCreatorPlaces, placesDevCreatorCreate: createCreatorDraft, placesDevCreatorOpen: openCreatorDraft, placesDevCreatorDelete: deleteCreatorDraft };
for (const [name, handler] of Object.entries(handlers)) {
  app.post('/historyczny-rybnik/europe-central2/' + name, async (req, res) => {
    try { res.json({ result: await handler(db, { data: req.body?.data }, localAccess) }); }
    catch (error) {
      const codes = { 'invalid-argument': [400, 'INVALID_ARGUMENT'], 'not-found': [404, 'NOT_FOUND'], 'failed-precondition': [400, 'FAILED_PRECONDITION'], 'resource-exhausted': [429, 'RESOURCE_EXHAUSTED'] };
      const [status, code] = codes[error.code] ?? [500, 'INTERNAL'];
      res.status(status).json({ error: { status: code, message: status === 500 ? 'Operacja nie powiodła się.' : error.message } });
    }
  });
}
app.listen(5002, '127.0.0.1', () => console.log('Local creator API: 127.0.0.1:5002; database: places-dev'));
