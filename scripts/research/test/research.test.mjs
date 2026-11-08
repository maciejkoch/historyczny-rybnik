import { catalogSchema } from '../../../functions/src/contracts/places.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fixture } from './fixtures.mjs';
import { validateWorkspace } from '../model/schema.mjs';
import { imageSchema } from '../../../functions/src/contracts/places.mjs';
import {
  initWorkspace,
  loadWorkspace,
  atomicWrite,
  safePath,
  inventory,
} from '../workspace/files.mjs';
import { syncWorkspace } from '../sync/sync.mjs';
import { projectPlace } from '../publication/catalog.mjs';
import { preserveLiveFields } from '../../places/import-policy.mjs';
import { createViewer } from '../viewer/server.mjs';
async function workspace(t, data = fixture()) {
  const root = await mkdtemp(join(tmpdir(), 'rybnik-research-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await initWorkspace(root);
  for (const [key, value] of Object.entries(data))
    if (key === 'config' || key === 'tags')
      await atomicWrite(join(root, key + '.json'), JSON.stringify(value));
    else
      for (const row of value)
        await atomicWrite(join(root, key, row.id + '.json'), JSON.stringify(row));
  return root;
}
class Store {
  objects = new Map();
  n = 0;
  async get(key) {
    const v = this.objects.get(key);
    return v ? { bytes: Buffer.from(v.bytes), generation: v.generation } : null;
  }
  async put(key, bytes, generation = '0') {
    if ((this.objects.get(key)?.generation || '0') !== generation) {
      const e = new Error('Concurrent change');
      e.status = 412;
      throw e;
    }
    const gen = String(++this.n);
    this.objects.set(key, { bytes: Buffer.from(bytes), generation: gen });
    return gen;
  }
}

test('late publication can evidence 1932; earlier unresolved material remains dated 1890; graph and candidates persist', () => {
  const d = validateWorkspace(fixture());
  assert.equal(d.documents[1].publicationDate.from, '1950');
  assert.equal(d.documents[1].historicalDate.from, '1932');
  assert.equal(d.documents[0].historicalDate, null);
  assert.equal(d.sources[2].discoveredFrom[0].sourceId, 'src_b');
  assert.equal(d.candidates[0].status, 'pending');
});
test('reject broken links, tags, periods, rights approval, duplicate synonyms, decisions and ancestry cycles', () => {
  for (const change of [
    (d) => (d.places[0].tags = []),
    (d) => (d.mentions[0].verification = 'draft'),
    (d) => d.places[0].mentionIds.push('missing'),
    (d) => (d.documents[0].rights.publicationApproved = true),
    (d) => d.tags[1].synonyms.push('usługi'),
    (d) => (d.candidates[0].status = 'rejected'),
    (d) => (d.documents[0].parentDocumentId = 'mat_a'),
    (d) => (d.places[0].period.status = 'outside'),
  ]) {
    const d = fixture();
    change(d);
    assert.throws(() => validateWorkspace(d));
  }
  const d = fixture();
  d.places[0].period = {
    status: 'probable',
    explanation: 'Konkretny opis ciągłości; potrzebny dowód z lat 1918–1939.',
  };
  assert.equal(validateWorkspace(d).places[0].period.status, 'probable');
  d.places[0].period.status = 'unverified';
  d['out-of-period'] = d.places;
  d.places = [];
  assert.equal(validateWorkspace(d)['out-of-period'][0].id, 'place_a');
});
test('publication is explicit, excludes unknown-rights images and protects live location on repeated import', () => {
  const d = validateWorkspace(fixture()),
    p = d.places[0];
  assert.throws(() => projectPlace(p, d));
  p.publicationApproved = true;
  p.period.status = 'probable';
  const result = projectPlace(p, d);
  assert.equal(result.period.status, 'probable');
  assert.equal(result.tags.length, 2);
  assert.deepEqual(result.mentions[0].materials, []);
  assert.equal(result.findings, undefined);
  assert.equal(result.questions, undefined);
  assert.equal(result.relatedPlaces, undefined);
  assert.equal(result.mentionIds, undefined);
  catalogSchema.parse([result]);
  const live = {
    location: {
      coordinates: { lat: 50, lng: 18 },
      precision: 'building',
      explanation: 'Nowsza pozycja',
    },
    locationVersion: 7,
    createdAt: 'old',
    updatedAt: 'new',
  };
  assert.deepEqual(preserveLiveFields(result, live).location, live.location);
  assert.deepEqual(
    preserveLiveFields(preserveLiveFields(result, live), live),
    preserveLiveFields(result, live),
  );
});
test('sync mirrors exact relative paths and bytes, detects concurrent/local changes and restores old revision', async (t) => {
  const root = await workspace(t),
    store = new Store();
  const first = await syncWorkspace({ root, store, direction: 'push', apply: true });
  const second = await workspace(t, {
    config: fixture().config,
    tags: [],
    sources: [],
    materials: [],
    places: [],
    'out-of-period': [],
    candidates: [],
    research: [],
  });
  await syncWorkspace({ root: second, store, direction: 'pull', apply: true });
  assert.deepEqual(await inventory(root), await inventory(second));
  const source = JSON.parse(await readFile(join(root, 'sources/src_a.json')));
  source.description = 'Zmienione';
  await writeFile(join(root, 'sources/src_a.json'), JSON.stringify(source));
  const next = await syncWorkspace({ root, store, direction: 'push', apply: true });
  assert.notEqual(first.revision, next.revision);
  await assert.rejects(
    syncWorkspace({ root: second, store, direction: 'push', apply: true }),
    /Remote changed/,
  );
  await syncWorkspace({ root: second, store, direction: 'pull', apply: true });
  await syncWorkspace({
    root: second,
    store,
    direction: 'restore',
    restoreRevision: first.revision,
    apply: true,
  });
  assert.equal(
    JSON.parse(await readFile(join(second, 'sources/src_a.json'))).description,
    'Wyłącznie fixture testowe',
  );
  await writeFile(
    join(second, 'sources/src_a.json'),
    JSON.stringify({ ...source, description: 'Local edit' }),
  );
  await assert.rejects(
    syncWorkspace({ root: second, store, direction: 'pull', apply: true }),
    /Local changes/,
  );
});
test('interrupted push leaves old head; retry completes; explicit deletion approval is required', async (t) => {
  const root = await workspace(t),
    store = new Store();
  const first = await syncWorkspace({ root, store, direction: 'push', apply: true });
  await rm(join(root, 'research/run_a.json'));
  const plan = await syncWorkspace({ root, store, direction: 'push' });
  assert.deepEqual(plan.remove, ['research/run_a.json']);
  await assert.rejects(
    syncWorkspace({ root, store, direction: 'push', apply: true }),
    /Deletion preview/,
  );
  const original = store.put.bind(store);
  let once = true;
  store.put = async (...args) => {
    if (once && args[0].endsWith('/manifest.json')) {
      once = false;
      throw new Error('Interrupted');
    }
    return original(...args);
  };
  await assert.rejects(
    syncWorkspace({ root, store, direction: 'push', apply: true, approveDeletions: true }),
    /Interrupted/,
  );
  assert.equal(
    JSON.parse((await store.get('research-workspace/head.json')).bytes).revision,
    first.revision,
  );
  const next = await syncWorkspace({
    root,
    store,
    direction: 'push',
    apply: true,
    approveDeletions: true,
  });
  assert.notEqual(next.revision, first.revision);
});
test('workspace/server reject symlink traversal, cross-origin access and mutation; serve private files only locally', async (t) => {
  const root = await workspace(t);
  await symlink('/etc/passwd', join(root, 'files', 'secret'));
  await assert.rejects(safePath(root, 'files/secret'), /Symlinks/);
  await assert.rejects(safePath(root, '../outside'), /outside/);
  await rm(join(root, 'files/secret'));
  const server = await createViewer({ root, port: 0 });
  t.after(() => new Promise((r) => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base + '/api/workspace')).status, 200);
  assert.equal(
    (await fetch(base + '/api/workspace', { headers: { Origin: 'https://example.org' } })).status,
    403,
  );
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 403);
  assert.equal((await fetch(base + '/files/%2e%2e%2fconfig.json')).status, 400);
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/viewer.css')).status, 200);
  assert.equal((await fetch(base + '/app.js')).status, 200);
  for (const file of ['maplibre-gl.mjs', 'maplibre-gl-shared.mjs', 'maplibre-gl-worker.mjs'])
    assert.equal((await fetch(base + '/vendor/' + file)).status, 200);
  await writeFile(join(root, 'files/unsafe.html'), '<script>alert(1)</script>');
  const unsafe = await fetch(base + '/files/unsafe.html');
  assert.equal(unsafe.headers.get('content-type'), 'application/octet-stream');
  assert.equal(unsafe.headers.get('content-disposition'), 'attachment');
  assert.equal((await fetch(base + '/maptiles/10/564/346.webp')).status, 200);
});

test('lost head-write acknowledgement can be retried without overwriting concurrent edits', async (t) => {
  const root = await workspace(t),
    store = new Store();
  await syncWorkspace({ root, store, direction: 'push', apply: true });
  const source = JSON.parse(await readFile(join(root, 'sources/src_a.json')));
  source.description = 'Updated';
  await writeFile(join(root, 'sources/src_a.json'), JSON.stringify(source));
  const original = store.put.bind(store);
  let lost = true;
  store.put = async (...args) => {
    const gen = await original(...args);
    if (lost && args[0].endsWith('/head.json')) {
      lost = false;
      throw new Error('Lost acknowledgement');
    }
    return gen;
  };
  await assert.rejects(
    syncWorkspace({ root, store, direction: 'push', apply: true }),
    /Lost acknowledgement/,
  );
  const result = await syncWorkspace({ root, store, direction: 'push', apply: true });
  assert.ok(result.revision);
});

test('own scans preserve missing web provenance and allow a local documentary rights proof', () => {
  const d = fixture(),
    m = d.documents[0];
  m.rights = {
    status: 'public-domain',
    basis: 'Fikcyjny dowód w skanie dokumentacji',
    evidenceUrl: null,
    evidenceDocumentId: 'mat_b',
    checkedAt: '2026-11-08T08:00:00Z',
    credit: 'Fikcyjne archiwum',
    publicationApproved: true,
  };
  assert.equal(validateWorkspace(d).documents[0].rights.evidenceUrl, null);
  const { materialId, documentedDate, ...image } = JSON.parse(requireFixtureImage());
  for (const field of [
    'sourcePageUrl',
    'originalCollectionUrl',
    'originalImageUrl',
    'licenseUrl',
    'author',
  ])
    image.provenance[field] = null;
  assert.equal(imageSchema.parse(image).provenance.originalImageUrl, null);
});
function requireFixtureImage() {
  return JSON.stringify(
    JSON.parse(
      readFileSync(new URL('../../../data/places.fixture.json', import.meta.url)),
    ).flatMap((p) => p.mentions.flatMap((r) => r.materials))[0],
  );
}

test('a 1938 contemporary advertisement proves activity without a fabricated historicalDate', async () => {
  const { legacyPeriod } = await import('../migrations/legacy-period.mjs');
  const ref = {
    id: 'ad',
    title: 'Sztandar Polski i Gazeta Rybnicka',
    excerpt: 'Wzmianka o firmie A. Dział: Ogłoszenie prasowe.',
    excerptType: 'summary',
    publicationDate: { from: '1938', to: null, approximate: false },
    historicalDate: null,
    note: null,
  };
  assert.equal(legacyPeriod([ref]).status, 'confirmed');
  assert.equal(ref.historicalDate, null);
  assert.equal(
    legacyPeriod([{ ...ref, excerpt: 'Artykuł wspomina rok 1890.' }]).status,
    'unverified',
  );
  assert.equal(
    legacyPeriod([{ ...ref, publicationDate: { from: '1950', to: null, approximate: false } }])
      .status,
    'unverified',
  );
  assert.equal(
    legacyPeriod([{ ...ref, note: 'Powiązanie z tym miejscem jest przypuszczalne.' }]).status,
    'probable',
  );
});

test('internal unknown/restricted copies are retained and never become public images', async (t) => {
  const { capture } = await import('../workspace/capture.mjs');
  const d = fixture();
  d.documents[1].rights.status = 'restricted';
  const root = await workspace(t, d);
  const input = join(root, 'sample.pdf');
  await writeFile(input, '%PDF-1.4\ninternal fixture');
  const first = await capture({
    root,
    materialId: 'mat_a',
    collection: 'documents',
    input,
    apply: true,
  });
  const second = await capture({
    root,
    materialId: 'mat_b',
    collection: 'documents',
    input,
    apply: true,
  });
  assert.equal(first.path, second.path);
  const stored = await loadWorkspace(root);
  assert.equal(stored.documents[0].files.length, 1);
  assert.equal(stored.documents[1].files.length, 1);
  assert.equal(stored.documents[0].rights.status, 'unknown');
  stored.places[0].publicationApproved = true;
  assert.ok(projectPlace(stored.places[0], stored).mentions.every((r) => r.materials.length === 0));
  stored.documents[1].rights.publicationApproved = true;
  assert.throws(() => validateWorkspace(stored));
  await capture({ root, materialId: 'mat_a', collection: 'documents', input, apply: true });
  assert.equal((await loadWorkspace(root)).documents[0].files.length, 1);
  await writeFile(input, '<html>not a PDF</html>');
  await assert.rejects(
    capture({ root, materialId: 'mat_a', collection: 'documents', input, apply: true }),
    /format/,
  );
});

test('publication label never extends crop approval to a new full-page scan', async () => {
  const { publicationNotice } = await import('../../../tools/research-viewer/publication.mjs');
  const m = fixture().documents[0];
  m.rights.status = 'public-domain';
  m.rights.publicationApproved = true;
  m.publicationImages = [{ sha256: 'crop', thumbnailSha256: 'thumb' }];
  assert.equal(publicationNotice(m, { sha256: 'crop' }).approved, true);
  assert.equal(publicationNotice(m, { sha256: 'full-page' }).approved, false);
  m.rights.status = 'restricted';
  assert.equal(publicationNotice(m, { sha256: 'crop' }).approved, false);
});

test('documented dates retain separate 1920, 1928, 1945 evidence; no inferred continuity', async () => {
  const { documentedDates, materialMatchesMention } = await import('../model/chronology.mjs');
  const base = fixture().mentions[0];
  const mentions = ['1920', '1928', '1945'].map((year, i) => ({
    ...base,
    id: 'mention_' + i,
    documentedDate: { from: year, to: null, approximate: false },
    verification: 'verified',
  }));
  assert.deepEqual(
    documentedDates(mentions).map((x) => x.date.from),
    ['1920', '1928', '1945'],
  );
  const visual = {
    classification: 'historical',
    originalDate: { from: '1928', to: null, approximate: false },
    depictedDate: null,
    sourceDocumentIds: [base.evidence[0].documentId],
  };
  assert.equal(materialMatchesMention(visual, mentions[1]), true);
  assert.equal(materialMatchesMention(visual, mentions[0]), false);
  assert.equal(
    materialMatchesMention(
      { ...visual, originalDate: { from: '2023', to: null, approximate: false } },
      mentions[1],
    ),
    false,
  );
  assert.equal(
    materialMatchesMention({ ...visual, classification: 'source-copy' }, mentions[1]),
    false,
  );
  assert.equal(
    materialMatchesMention({ ...visual, sourceDocumentIds: ['unrelated'] }, mentions[1]),
    false,
  );
  const d = fixture();
  d.mentions[0].verification = 'verified';
  d.mentions[0].documentedDate = null;
  assert.throws(() => validateWorkspace(d));
});

test('historical publication keeps material identity and relocates legacy image paths consistently', async () => {
  const { publicationImages } = await import('../publication/assets.mjs');
  const d = fixture(),
    p = d.places[0],
    mention = d.mentions.find((m) => p.mentionIds.includes(m.id) && m.verification === 'verified');
  const sample = JSON.parse(readFileSync('data/places.fixture.json', 'utf8'))[0].mentions.flatMap(
    (m) => m.materials,
  )[0];
  assert.ok(sample);
  const { materialId, documentedDate, ...image } = sample;
  const visual = {
    id: 'vis_test',
    classification: 'historical',
    sourceDocumentIds: [mention.evidence[0].documentId],
    originalDate: mention.documentedDate,
    depictedDate: null,
    rights: { publicationApproved: true },
    publicationImages: [image],
  };
  d.materials.push(visual);
  mention.materialIds.push(visual.id);
  p.publicationApproved = true;
  const result = projectPlace(p, d),
    published = result.mentions.find((m) => m.id === mention.id).materials[0];
  assert.equal(published.materialId, visual.id);
  assert.deepEqual(published.documentedDate, mention.documentedDate);
  assert.equal(published.storagePath, publicationImages(visual)[0].storagePath);
  assert.ok(published.storagePath.startsWith('public/materials/vis_test/'));
  catalogSchema.parse([result]);
});
