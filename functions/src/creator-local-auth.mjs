import { HttpsError } from 'firebase-functions/v2/https';
import { requireCreatorIdentity } from './creator.mjs';

export async function authenticateLocal(authorization, verifyIdToken) {
  const match =
    typeof authorization === 'string' && authorization.length <= 16384
      ? /^Bearer ([^\s]+)$/i.exec(authorization)
      : null;
  if (!match) throw new HttpsError('unauthenticated', 'Google authentication required');
  let token;
  try {
    token = await verifyIdToken(match[1]);
  } catch {
    throw new HttpsError('unauthenticated', 'Google authentication required');
  }
  const request = { auth: { uid: token.uid, token } };
  requireCreatorIdentity(request);
  return request.auth;
}
