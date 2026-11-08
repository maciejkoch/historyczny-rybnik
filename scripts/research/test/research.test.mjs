import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fixture } from './fixtures.mjs';
import { validateWorkspace } from '../model.mjs';
import { initWorkspace, loadWorkspace, atomicWrite, safePath, inventory } from '../workspace.mjs';
import { syncWorkspace } from '../sync.mjs';
import { projectPlace } from '../publish.mjs';
import { preserveLiveFields } from '../../places/import-policy.mjs';
import { createViewer } from '../viewer.mjs';
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
  assert.equal(d.materials[1].publicationDate.from, '1950');
  assert.equal(d.materials[1].historicalDate.from, '1932');
  assert.equal(d.materials[0].historicalDate, null);
  assert.equal(d.sources[2].discoveredFrom[0].sourceId, 'src_b');
  assert.equal(d.candidates[0].status, 'pending');
});
test('reject broken links, tags, periods, rights approval, duplicate synonyms, decisions and ancestry cycles', () => {
  for (const change of [
    (d) => (d.places[0].tags = []),
    (d) => (d.places[0].period.evidence = []),
    (d) => d.places[0].materialIds.push('missing'),
    (d) => (d.materials[0].rights.publicationApproved = true),
    (d) => d.tags[1].synonyms.push('usługi'),
    (d) => (d.candidates[0].status = 'rejected'),
    (d) => (d.materials[0].parentMaterialId = 'mat_a'),
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
    evidence: [],
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
  assert.deepEqual(result.references[0].images, []);
  assert.equal(result.findings, undefined);
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
