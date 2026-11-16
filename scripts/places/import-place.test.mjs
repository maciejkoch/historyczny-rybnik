import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bundleSchema, planImport, digest, validateAssets, fromDocument } from './import-place.mjs';

const fixture = JSON.parse(
  readFileSync(new URL('../../data/places.fixture.json', import.meta.url)),
)[0];
const place = () => structuredClone({ ...fixture, materials: [], mentions: [] });
const bundle = (p = place(), expectedUpdatedAt = null) => ({
  schemaVersion: 1,
  expectedUpdatedAt,
  assetsDirectory: './images',
  place: p,
});

test('current contract rejects private or retired fields and invalid references', () => {
  assert.ok(bundleSchema.safeParse(bundle()).success);
  assert.equal(bundleSchema.safeParse({ ...bundle(), rights: 'private' }).success, false);
  assert.equal(bundleSchema.safeParse(bundle({ ...place(), references: [] })).success, false);
  assert.equal(
    bundleSchema.safeParse(bundle({ ...place(), mentions: fixture.mentions })).success,
    false,
  );
});

test('create and update affect only the reviewed record; slug collisions include drafts', () => {
  const p = place();
  assert.equal(planImport(bundle(p), null, [{ id: 'unrelated', slug: 'other' }]).desired.id, p.id);
  assert.throws(() => planImport(bundle(p), null, [{ id: 'draft', slug: p.slug }]), /Slug/);
  assert.throws(() => planImport(bundle(p), { ...p, name: 'Another place' }), /ID already exists/);
  assert.equal(planImport(bundle(p), { ...p, updatedAt: '2026-11-16T12:00:00Z' }).unchanged, true);
  assert.throws(() => planImport(bundle(p, p.updatedAt), null), /no longer exists/);
});

test('stale approval cannot overwrite a new location or editorial content', () => {
  const p = place(),
    current = {
      ...p,
      updatedAt: '2026-11-16T12:00:00Z',
      location: { ...p.location, explanation: 'New owner location' },
    };
  assert.throws(() => planImport(bundle(p, p.updatedAt), current), /changed since review/);
});

test('editorial update preserves creation time, requires stable slug and supports no-op retry', () => {
  const current = place();
  const p = { ...current, description: 'Reviewed update', createdAt: '2026-11-16T12:00:00Z' };
  const b = bundle(p, current.updatedAt),
    plan = planImport(b, current);
  assert.equal(plan.desired.createdAt, current.createdAt);
  assert.equal(plan.desired.description, 'Reviewed update');
  const imported = { ...plan.desired, updatedAt: '2026-11-16T12:00:01Z' };
  assert.equal(planImport(b, imported).unchanged, true);
  assert.throws(
    () => planImport(bundle({ ...p, slug: 'new-slug' }, current.updatedAt), current),
    /slug/,
  );
});

test('unchanged gallery needs no local files; modified bytes need immutable names', () => {
  const current = structuredClone(fixture);
  const p = { ...current, description: 'Updated description' };
  assert.deepEqual(planImport(bundle(p, current.updatedAt), current).materials, []);
  p.materials[0].sha256 = 'c'.repeat(64);
  const old = structuredClone(fixture);
  assert.throws(() => planImport(bundle(p, old.updatedAt), old), /new immutable/);
});

test('assets reject oversized, mismatched or non-image bytes before upload', () => {
  const root = mkdtempSync(join(tmpdir(), 'place-assets-'));
  try {
    const bytes = Buffer.from('not an image');
    writeFileSync(join(root, 'image.png'), bytes);
    const m = {
      ...fixture.materials[0],
      storagePath: 'public/materials/fixture_image/image.png',
      thumbnailPath: 'public/materials/fixture_image/image.png',
      sha256: digest(bytes),
      thumbnailSha256: digest(bytes),
    };
    assert.throws(() => validateAssets([m], root), /not an image/);
    m.sha256 = '0'.repeat(64);
    assert.throws(() => validateAssets([m], root), /SHA-256/);
    writeFileSync(join(root, 'image.png'), Buffer.alloc(3000001));
    assert.throws(() => validateAssets([m], root), /3 MB/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Firestore serialization round-trip uses current contract and public coordinates', () => {
  const p = place();
  const { id, ...data } = p;
  assert.deepEqual(
    fromDocument({
      exists: true,
      id,
      data: () => ({
        ...data,
        location: { ...p.location, coordinates: { latitude: 50, longitude: 18 } },
        createdAt: { toDate: () => new Date(p.createdAt) },
        updatedAt: { toDate: () => new Date(p.updatedAt) },
      }),
    }),
    {
      ...p,
      createdAt: new Date(p.createdAt).toISOString(),
      updatedAt: new Date(p.updatedAt).toISOString(),
    },
  );
});

test('CLI dry run is offline; changed approval and wrong target cannot reach cloud', () => {
  const root = mkdtempSync(join(tmpdir(), 'place-cli-'));
  const script = new URL('./import-place.mjs', import.meta.url);
  try {
    const file = join(root, 'bundle.json'),
      bytes = JSON.stringify(bundle());
    writeFileSync(file, bytes);
    const run = (...args) =>
      spawnSync(process.execPath, [fileURLToPath(script), file, ...args], {
        encoding: 'utf8',
        env: { ...process.env, GCLOUD_PROJECT: 'wrong-target' },
      });
    const dry = run();
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /Dry run; no cloud access/);
    assert.equal(run('--apply', `--approved-sha256=${'0'.repeat(64)}`).status, 1);
    assert.equal(run('--apply', `--approved-sha256=${digest(bytes)}`).status, 1);
    assert.equal(run('--unknown').status, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
