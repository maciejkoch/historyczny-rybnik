import { createRequire } from 'node:module';
const require = createRequire(new URL('../functions/package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const [action, uid, ...flags] = process.argv.slice(2);
if (
  !['grant', 'revoke', 'show'].includes(action) ||
  !uid ||
  flags.some((f) => !['--apply', '--firebase-cli'].includes(f))
)
  throw new Error('Usage: npm run auth:admin -- grant|revoke|show UID [--apply] [--firebase-cli]');
let credential = applicationDefault();
if (flags.includes('--firebase-cli')) {
  const cli = createRequire(new URL('../package.json', import.meta.url));
  const { getGlobalDefaultAccount } = cli('firebase-tools/lib/auth');
  const { clientId, clientSecret } = cli('firebase-tools/lib/api');
  const { OAuth2Client } = require('google-auth-library');
  const account = getGlobalDefaultAccount();
  if (!account) throw new Error('Sign in with firebase login first');
  const client = new OAuth2Client({ clientId: clientId(), clientSecret: clientSecret() });
  client.setCredentials({ refresh_token: account.tokens.refresh_token });
  credential = {
    getAccessToken: async () => {
      const { token } = await client.getAccessToken();
      return { access_token: token, expires_in: 300 };
    },
  };
}
const auth = getAuth(initializeApp({ projectId: 'historyczny-rybnik', credential }));
const user = await auth.getUser(uid);
const claims = { ...user.customClaims };
if (action === 'grant') claims.admin = true;
if (action === 'revoke') delete claims.admin;
if (action !== 'show' && flags.includes('--apply')) {
  await auth.setCustomUserClaims(uid, claims);
  const saved = await auth.getUser(uid);
  if ((saved.customClaims?.admin === true) !== (claims.admin === true))
    throw new Error('Role verification failed');
}
console.log(
  JSON.stringify({
    uid,
    admin: action === 'show' ? user.customClaims?.admin === true : claims.admin === true,
    applied: action !== 'show' && flags.includes('--apply'),
  }),
);
