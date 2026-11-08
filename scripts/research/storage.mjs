import { createRequire } from 'node:module';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { GoogleAuth, OAuth2Client } = require('google-auth-library');
export const bucket = 'historyczny-rybnik-dev-files';
export const prefix = 'research-workspace/';
export async function storageClient(firebaseCli = false) {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0')
    throw new Error('TLS verification must remain enabled');
  let auth;
  if (firebaseCli) {
    const cli = createRequire(new URL('../../package.json', import.meta.url));
    const account = cli('firebase-tools/lib/auth').getGlobalDefaultAccount();
    if (!account) throw new Error('Sign in using firebase login');
    const api = cli('firebase-tools/lib/api');
    auth = new OAuth2Client({ clientId: api.clientId(), clientSecret: api.clientSecret() });
    auth.setCredentials({ refresh_token: account.tokens.refresh_token });
  } else
    auth = await new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/devstorage.read_write'],
    }).getClient();
  async function request(url, options = {}) {
    const headers = await auth.getRequestHeaders();
    return fetch(url, {
      ...options,
      headers: {
        Authorization: headers.get ? headers.get('authorization') : headers.Authorization,
        ...options.headers,
      },
    });
  }
  const object = (name) => {
    if (!name.startsWith(prefix) || name.includes('..'))
      throw new Error('Storage path outside private workspace');
    return `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(name)}`;
  };
  return {
    async getPublicAsset(name) {
      if (!/^public\/(places|materials)\//.test(name) || name.includes('..'))
        throw new Error('Invalid published path');
      const base = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(name)}`;
      const r = await request(base);
      if (!r.ok) throw new Error(`Published metadata HTTP ${r.status}`);
      const meta = await r.json();
      const file = await request(base + `?alt=media&generation=${meta.generation}`);
      if (!file.ok) throw new Error(`Published read HTTP ${file.status}`);
      return Buffer.from(await file.arrayBuffer());
    },
    async putPublicAsset(name, bytes, mime) {
      if (!/^public\/materials\/[a-zA-Z0-9_-]{1,100}\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(name))
        throw new Error('Invalid public material path');
      const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(name)}&ifGenerationMatch=0`;
      const r = await request(url, {
        method: 'POST',
        headers: { 'Content-Type': mime },
        body: bytes,
      });
      if (r.status === 412) {
        const current = await request(
          `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(name)}?alt=media`,
        );
        if (!current.ok || !Buffer.from(await current.arrayBuffer()).equals(bytes))
          throw new Error('Existing public asset differs');
      } else if (!r.ok) throw new Error(`Public upload HTTP ${r.status}`);
    },
    async verifyPrivacy() {
      const r = await request(`https://storage.googleapis.com/storage/v1/b/${bucket}/iam`);
      if (!r.ok) throw new Error(`Cannot verify bucket IAM: HTTP ${r.status}`);
      const policy = await r.json();
      if (
        (policy.bindings || []).some((b) =>
          b.members?.some((m) => ['allUsers', 'allAuthenticatedUsers'].includes(m)),
        )
      )
        throw new Error('Bucket has public IAM bindings; private workshop is blocked');
      const info = await request(
        `https://storage.googleapis.com/storage/v1/b/${bucket}?fields=iamConfiguration,defaultObjectAcl`,
      );
      if (!info.ok) throw new Error(`Cannot verify default object ACL: HTTP ${info.status}`);
      const configuration = await info.json();
      if (
        !configuration.iamConfiguration?.uniformBucketLevelAccess?.enabled &&
        configuration.defaultObjectAcl?.some((a) =>
          ['allUsers', 'allAuthenticatedUsers'].includes(a.entity),
        )
      )
        throw new Error('Public default object ACL; private workshop is blocked');
      return { bucket, publicIamBindings: false };
    },
    async get(name) {
      const meta = await request(object(name));
      if (meta.status === 404) return null;
      if (!meta.ok) throw new Error(`Storage metadata HTTP ${meta.status}`);
      const info = await meta.json();
      const r = await request(object(name) + `?alt=media&generation=${info.generation}`);
      if (!r.ok) throw new Error(`Storage read HTTP ${r.status}`);
      return { bytes: Buffer.from(await r.arrayBuffer()), generation: info.generation };
    },
    async put(name, bytes, generation = '0') {
      object(name);
      const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(name)}&ifGenerationMatch=${generation}`;
      const r = await request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: bytes,
      });
      if (!r.ok) {
        const error = new Error(
          `Storage write HTTP ${r.status}${r.status === 412 ? ' — concurrent change' : ''}`,
        );
        error.status = r.status;
        throw error;
      }
      return (await r.json()).generation;
    },
  };
}
