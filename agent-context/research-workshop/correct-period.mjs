import { readFile, rm } from 'node:fs/promises';
import { loadWorkspace, atomicWrite, safePath } from '../../scripts/research/workspace.mjs';
import { legacyPeriod, legacyTemporalContext } from '../../scripts/research/legacy-period.mjs';
const apply = process.argv.includes('--apply'),
  root = 'data/places',
  catalog = JSON.parse(await readFile('data/places.catalog.json'));
const data = await loadWorkspace(root),
  places = new Map([...data.places, ...data['out-of-period']].map((p) => [p.id, p])),
  materials = new Map(data.materials.map((m) => [m.id, m]));
const counts = { confirmed: 0, probable: 0, unverified: 0 },
  updatedMaterials = new Set();
for (const old of catalog) {
  const p = places.get(old.id);
  if (!p) throw new Error('Missing migrated place');
  for (const r of old.references) {
    const f = p.findings.find((f) => f.id === r.id);
    if (!f || f.text !== r.excerpt || f.evidence.length !== 1)
      throw new Error('Research changed since migration; manual reconciliation required');
    const m = materials.get(f.evidence[0].materialId);
    const context = legacyTemporalContext(r);
    if (m.temporalContext && m.temporalContext !== 'unknown' && m.temporalContext !== context)
      throw new Error('Existing temporal assessment differs');
    m.temporalContext = context;
    updatedMaterials.add(m.id);
  }
  const q = legacyPeriod(old.references);
  counts[q.status]++;
  p.period = {
    status: q.status,
    explanation: q.explanation,
    evidence: q.proofs.map((proof) => {
      const e = p.findings.find((f) => f.id === proof.referenceId).evidence[0];
      return { ...e, note: proof.note };
    }),
  };
  if (q.status !== 'unverified')
    p.questions = p.questions.filter((q) => q !== 'Sprawdzić istnienie w okresie międzywojennym.');
  old.period = { status: q.status, explanation: q.explanation };
  if (apply) {
    const folder = q.status === 'unverified' ? 'out-of-period' : 'places',
      previous = data.places.some((x) => x.id === p.id) ? 'places' : 'out-of-period';
    await atomicWrite(
      await safePath(root, `${folder}/${p.id}.json`),
      JSON.stringify(p, null, 2) + '\n',
    );
    if (folder !== previous) await rm(await safePath(root, `${previous}/${p.id}.json`));
  }
}
if (apply) {
  for (const id of updatedMaterials)
    await atomicWrite(
      await safePath(root, `materials/${id}.json`),
      JSON.stringify(materials.get(id), null, 2) + '\n',
    );
  await atomicWrite('data/places.catalog.json', JSON.stringify(catalog, null, 2) + '\n');
  await loadWorkspace(root);
}
console.log({ applied: apply, ...counts });
