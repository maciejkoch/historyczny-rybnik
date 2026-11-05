import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateCatalog } from '../../functions/src/validation.mjs';
const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { GoogleAuth, OAuth2Client } = require('google-auth-library');
const bucket = 'historyczny-rybnik-dev-files';
const assets = JSON.parse(readFileSync('data/place-assets.json', 'utf8'));
const places = validateCatalog(JSON.parse(readFileSync('data/places.seed.json', 'utf8')));
const allowed = new Set(
  places
    .filter((p) => p.published)
    .flatMap((p) =>
      p.references.flatMap((r) => r.images.flatMap((i) => [i.storagePath, i.thumbnailPath])),
    ),
);
for (const asset of assets) {
  if (
    !allowed.has(asset.storagePath) ||
    !/^data\/assets\/[a-z0-9-]+\.jpg$/.test(asset.file) ||
    asset.contentType !== 'image/jpeg'
  )
    throw new Error('Asset is outside the reviewed catalogue');
  const bytes = readFileSync(asset.file);
  if (bytes.length > 3000000 || createHash('sha256').update(bytes).digest('hex') !== asset.sha256)
    throw new Error('Asset hash or size mismatch');
  console.log(`${asset.storagePath}: ${bytes.length} bytes, SHA-256 OK`);
}
if (!process.argv.includes('--apply')) {
  console.log(
    'Dry run. Use --apply with operator ADC or --firebase-cli to upload reviewed assets.',
  );
  process.exit(0);
}
let client;
if (process.argv.includes('--firebase-cli')) {
  const cli = createRequire(new URL('../../package.json', import.meta.url));
  const { getGlobalDefaultAccount } = cli('firebase-tools/lib/auth');
  const { clientId, clientSecret } = cli('firebase-tools/lib/api');
  const account = getGlobalDefaultAccount();
  if (!account) throw new Error('Sign in with firebase login');
  client = new OAuth2Client({ clientId: clientId(), clientSecret: clientSecret() });
  client.setCredentials({ refresh_token: account.tokens.refresh_token });
}
if (!client)
  client = await new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/devstorage.read_write'],
  }).getClient();
for (const asset of assets) {
  const headers = await client.getRequestHeaders();
  const auth = headers.get ? headers.get('authorization') : headers.Authorization;
  // Immutable names: creating a different file at an existing path is forbidden.
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=multipart&ifGenerationMatch=0`;
  const boundary = 'reviewed-place-asset';
  const metadata = {
    name: asset.storagePath,
    contentType: asset.contentType,
    cacheControl: 'public, max-age=31536000, immutable',
    metadata: {
      sha256: asset.sha256,
      rights: 'Public domain; Public Domain Mark 1.0',
      source: 'https://commons.wikimedia.org/w/index.php?curid=95284888',
    },
  };
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${asset.contentType}\r\n\r\n`,
    ),
    readFileSync(asset.file),
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (response.status === 412) {
    const existing = await fetch(
      `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(asset.storagePath)}`,
      { headers: { Authorization: auth } },
    );
    const info = await existing.json();
    if (!existing.ok || info.metadata?.sha256 !== asset.sha256)
      throw new Error(`Existing asset differs: ${asset.storagePath}`);
    console.log(`Already uploaded, matching SHA-256: ${asset.storagePath}`);
    continue;
  }
  if (!response.ok)
    throw new Error(`Upload failed: HTTP ${response.status} ${await response.text()}`);
  console.log(`Uploaded to dev Storage: ${asset.storagePath}`);
}
