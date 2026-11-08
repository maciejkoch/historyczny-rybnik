import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { publicCatalog } from '../../scripts/places/catalog.mjs';
const testData = JSON.parse(
  readFileSync(new URL('../../data/places.fixture.json', import.meta.url)),
);
test('SSG preserves image provenance and variant hashes from the place document', () => {
  const result = publicCatalog(testData);
  const image = result[0].mentions.find((ref) => ref.materials.length).materials[0];
  assert.deepEqual(image, testData[0].mentions.find((ref) => ref.materials.length).materials[0]);
  assert.equal(image.provenance.rightsCheckedAt, '2026-11-05');
  assert.match(image.sha256, /^[a-f0-9]{64}$/);
});
test('SSG excludes drafts and rejects unexpected fields', () => {
  const draft = structuredClone(testData[0]);
  draft.id = 'draft';
  draft.slug = 'draft';
  draft.previousSlugs = [];
  draft.published = false;
  draft.mentions.forEach((ref) => {
    ref.materials = [];
  });
  const result = publicCatalog([...testData, draft]);
  assert.equal(result.length, 1);
  assert.equal(result[0].published, undefined);
  assert.equal(result[0].createdAt, undefined);
  assert.throws(() => publicCatalog([{ ...testData[0], privateNote: 'secret' }]));
});
test('missing location and reference without scan are valid local variants', () => {
  const value = structuredClone(testData);
  value[0].location = { coordinates: null, precision: 'unknown', explanation: null };
  const result = publicCatalog(value);
  assert.equal(result[0].location.coordinates, null);
  assert.deepEqual(result[0].mentions[0].materials, []);
});

test('generator works without a real catalogue and keeps Hosting templates unchanged', async (t) => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join, isAbsolute } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const directory = mkdtempSync(join(tmpdir(), 'rybnik-fixture-build-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const template = { hosting: { site: 'fixture-site', public: 'public', redirects: [] } };
  writeFileSync(join(directory, 'firebase.dev.json'), JSON.stringify(template));
  const generator = new URL('../../scripts/places/catalog.mjs', import.meta.url).href;
  const run = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import { generate } from ${JSON.stringify(generator)}; generate(${JSON.stringify(testData)});`,
    ],
    { cwd: directory, encoding: 'utf8' },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(directory, 'firebase.dev.json'))), template);
  const generated = JSON.parse(readFileSync(join(directory, '.local/firebase.dev.json')));
  assert.equal(generated.hosting.site, template.hosting.site);
  assert.ok(isAbsolute(generated.hosting.public));
  assert.equal(generated.hosting.redirects[0].destination, '/miejsca/' + testData[0].slug);
  const index = JSON.parse(readFileSync(join(directory, 'public/search-index.json')));
  assert.deepEqual(
    index.map((p) => p.id),
    ['fixture_place'],
  );
  assert.match(
    readFileSync(join(directory, 'src/app/places/catalog.generated.ts'), 'utf8'),
    /fixture_place/,
  );
});
