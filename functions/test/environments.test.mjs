import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

test('production data configuration targets only its own database and bucket', () => {
  const prod = json('firebase.backend.prod.json');
  const dev = json('firebase.backend.dev.json');
  const targets = json('.firebaserc').targets['historyczny-rybnik'].storage;
  assert.deepEqual(
    prod.firestore.map((db) => db.database),
    ['places-prod'],
  );
  assert.deepEqual(
    prod.storage.map((bucket) => bucket.target),
    ['places-prod'],
  );
  assert.deepEqual(targets['places-prod'], ['historyczny-rybnik-prod-files']);
  assert.deepEqual(targets['places-dev'], ['historyczny-rybnik-dev-files']);
  assert.notEqual(prod.firestore[0].database, dev.firestore[0].database);
  assert.equal(prod.firestore[0].rules, dev.firestore[0].rules);
  assert.equal(prod.storage[0].rules, dev.storage[0].rules);
  assert.equal(prod.auth, undefined);
  assert.equal(prod.hosting, undefined);
  assert.equal(prod.functions, undefined);
});

test('planned production service identities are scoped to the production database', () => {
  const prod = json('infra/iam.prod.json');
  const dev = json('infra/iam.dev.json');
  assert.equal(prod.projectId, 'historyczny-rybnik');
  assert.equal(prod.databaseId, 'places-prod');
  assert.equal(
    prod.condition.expression,
    'resource.name == "projects/historyczny-rybnik/databases/places-prod"',
  );
  const prodRoles = Object.values(prod.roles);
  const devAccounts = new Set(Object.values(dev.roles).map((role) => role.serviceAccount));
  assert.equal(prodRoles.length, 3);
  for (const role of prodRoles) {
    assert.match(
      role.serviceAccount,
      /^places-prod-(api|import|build)@historyczny-rybnik\.iam\.gserviceaccount\.com$/,
    );
    assert.equal(devAccounts.has(role.serviceAccount), false);
    assert.equal(role.includedPermissions.includes('datastore.entities.delete'), false);
  }
});

test('production functions use only production identities and Warsaw region', async () => {
  const functions = await import('../src/index.prod.mjs');
  assert.deepEqual(Object.keys(functions).sort(), [
    'placesProdRead',
    'placesProdUpdate',
    'placesProdWeb',
  ]);
  for (const [name, fn] of Object.entries(functions)) {
    assert.deepEqual(fn.__endpoint.region, ['europe-central2']);
    const identity = name === 'placesProdWeb' ? 'build' : 'api';
    assert.equal(
      fn.__endpoint.serviceAccountEmail,
      `places-prod-${identity}@historyczny-rybnik.iam.gserviceaccount.com`,
    );
  }
});

test('production material importer is limited to its bucket and cannot delete objects', () => {
  const { storage } = json('infra/iam.prod.json');
  assert.equal(storage.bucket, 'historyczny-rybnik-prod-files');
  assert.equal(
    storage.serviceAccount,
    'places-prod-import@historyczny-rybnik.iam.gserviceaccount.com',
  );
  assert.deepEqual([...storage.includedPermissions].sort(), [
    'storage.objects.create',
    'storage.objects.get',
    'storage.objects.list',
  ]);
});

test('shared Auth configuration retains the production and all dev domains', () => {
  const redirects = json('firebase.backend.dev.json').auth.providers.googleSignIn
    .authorizedRedirectUris;
  for (const domain of [
    'historyczny.rybnik.pl',
    'historyczny-rybnik-dev.web.app',
    'historyczny-rybnik-dev-1.web.app',
    'historyczny-rybnik-dev-2.web.app',
    'historyczny-rybnik-dev-3.web.app',
  ]) {
    assert.ok(redirects.includes(`https://${domain}/__/auth/handler`));
  }
});

test('locked production configuration targets only production data resources', () => {
  const locked = json('firebase.backend.prod.locked.json');
  assert.deepEqual(
    locked.firestore.map((db) => db.database),
    ['places-prod'],
  );
  assert.deepEqual(
    locked.storage.map((bucket) => bucket.target),
    ['places-prod'],
  );
  assert.equal(locked.storage[0].rules, 'storage.prod.locked.rules');
  assert.equal(locked.functions, undefined);
  assert.equal(locked.hosting, undefined);
  assert.equal(locked.auth, undefined);
});

test('material backup is private, scoped and cannot delete or overwrite files', () => {
  const job = json('infra/storage-transfer.prod.json');
  const iam = json('infra/iam.prod.json').storageBackup;
  assert.equal(job.projectId, 'historyczny-rybnik');
  assert.equal(job.transferSpec.gcsDataSource.bucketName, iam.sourceBucket);
  assert.equal(job.transferSpec.gcsDataSink.bucketName, iam.destinationBucket);
  assert.deepEqual(job.transferSpec.objectConditions.includePrefixes, ['public/materials/']);
  assert.equal(job.transferSpec.transferOptions.overwriteWhen, 'NEVER');
  assert.equal(job.transferSpec.transferOptions.deleteObjectsFromSourceAfterTransfer, false);
  assert.equal(job.transferSpec.transferOptions.deleteObjectsUniqueInSink, false);
  assert.equal(iam.sourcePermissions.includes('storage.objects.delete'), false);
  assert.equal(iam.destinationPermissions.includes('storage.objects.delete'), false);
  assert.equal(job.schedule.repeatInterval, '86400s');
});
