import { createRequire } from 'node:module';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { Firestore, GeoPoint, Timestamp } = require('@google-cloud/firestore');
const { GoogleAuth, OAuth2Client, Impersonated } = require('google-auth-library');
export { GeoPoint, Timestamp };
export async function database(role) {
  const projectId = process.env['GCLOUD_PROJECT'];
  if (!projectId || (!process.env['FIRESTORE_EMULATOR_HOST'] && projectId !== 'historyczny-rybnik'))
    throw new Error('Set GCLOUD_PROJECT explicitly; only reviewed dev target permitted');
  const options = { projectId, databaseId: 'places-dev' };
  if (process.argv.includes('--firebase-cli')) {
    const cli = createRequire(new URL('../../package.json', import.meta.url));
    const { getGlobalDefaultAccount } = cli('firebase-tools/lib/auth');
    const { clientId, clientSecret } = cli('firebase-tools/lib/api');
    const account = getGlobalDefaultAccount();
    if (!account) throw new Error('Sign in with firebase login first');
    const email = `places-dev-${role}@historyczny-rybnik.iam.gserviceaccount.com`;
    // GoogleAuth refreshes/impersonates in memory; no credential files or keys.
    const sourceClient = new OAuth2Client({ clientId: clientId(), clientSecret: clientSecret() });
    sourceClient.setCredentials({ refresh_token: account.tokens.refresh_token });
    const authClient = new Impersonated({
      sourceClient,
      targetPrincipal: email,
      targetScopes: ['https://www.googleapis.com/auth/datastore'],
      lifetime: 900,
    });
    options.auth = new GoogleAuth({ authClient, projectId });
  }
  return new Firestore(options);
}
