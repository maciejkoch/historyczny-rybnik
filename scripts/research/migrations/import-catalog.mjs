import { restructureWorkspace } from './workspace-v2-v3.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import { initWorkspace, loadWorkspace, safePath, hash, atomicWrite } from '../workspace/files.mjs';
import { upgradePlace } from './legacy-catalog.mjs';
import { legacyTemporalContext, legacyPeriod } from './legacy-period.mjs';
import { validateWorkspace } from '../model/schema.mjs';
export async function migrate({ root, input, apply = false }) {
  await initWorkspace(root);
  const existing = await loadWorkspace(root);
  const catalog = JSON.parse(await readFile(input, 'utf8'));
  let data = {
    config: existing.config,
    tags: [],
    sources: [],
    materials: [],
    places: [],
    candidates: [],
    'out-of-period': [],
    research: [],
  };
  const stamp = new Date().toISOString(),
    sources = new Map(),
    materials = new Map(),
    tags = new Map();
  const rights = JSON.parse(await readFile('.local/source-rights.json', 'utf8')).sources;
  for (const raw of catalog) {
    const upgraded = upgradePlace(raw);
    const p = {
      ...upgraded,
      references: upgraded.mentions.map((m) => ({
        ...m,
        historicalDate: m.documentedDate,
        images: m.materials.map(({ materialId, documentedDate, ...image }) => image),
      })),
    };
    const materialIds = [],
      findings = [];
    for (const ref of p.references) {
      const sourceUrl = ref.url ? new URL(ref.url).origin : null;
      // Offline references have a stable identity derived from title, not a made-up URL.
      const sourceId = 'src_' + hash(Buffer.from(sourceUrl || ref.title)).slice(0, 24);
      if (!sources.has(sourceId))
        sources.set(sourceId, {
          id: sourceId,
          updatedAt: stamp,
          name: sourceUrl || ref.title,
          url: sourceUrl,
          description: sourceUrl
            ? 'Źródło przeniesionych referencji; zakres wymaga dalszego opisania.'
            : 'Źródło bez adresu internetowego; zachowano nazwę z referencji.',
          owner: null,
          topics: [],
          geography: ['Rybnik'],
          coverage: null,
          languages: [],
          resourceTypes: [],
          searchInstructions: null,
          ocr: 'unknown',
          access: sourceUrl ? 'public' : 'offline',
          accessNote: null,
          rightsNote: null,
          rightsUrl: null,
          checkedAt: null,
          discoveredFrom: [],
        });
      const materialId =
        'mat_' +
        hash(Buffer.from(JSON.stringify([ref.url, ref.title, ref.page, ref.excerpt]))).slice(0, 24);
      materialIds.push(materialId);
      if (!materials.has(materialId)) {
        const decision = Object.values(rights).find((r) =>
          r.materials?.some((m) => m.placeId === p.id && m.referenceId === ref.id),
        );
        materials.set(materialId, {
          id: materialId,
          updatedAt: stamp,
          title: ref.title,
          kind: 'other',
          temporalContext: legacyTemporalContext(ref),
          sourceId,
          url: ref.url,
          identifier: null,
          author: null,
          publicationDate: ref.publicationDate,
          historicalDate: ref.historicalDate,
          dateNote: ref.note,
          locator: ref.page,
          description:
            'Wzmianka przeniesiona z istniejącego katalogu; nie wykonano nowego badania.',
          content: ref.excerpt,
          contentType: ref.excerptType,
          placeIds: [],
          parentMaterialId: null,
          publicationImages: [],
          rights: {
            status: decision?.status === 'public-domain' ? 'public-domain' : 'unknown',
            basis: decision?.status === 'public-domain' ? decision.evidenceText : null,
            evidenceMaterialId: null,
            evidenceUrl: decision?.status === 'public-domain' ? decision.evidenceUrl : null,
            checkedAt:
              decision?.status === 'public-domain' ? decision.checkedAt + 'T00:00:00Z' : null,
            credit: ref.images[0]?.credit || null,
            publicationApproved: false,
          },
          files: [],
        });
      }
      const m = materials.get(materialId);
      if (!m.placeIds.includes(p.id)) m.placeIds.push(p.id);
      for (const image of ref.images)
        if (!m.publicationImages.some((i) => i.storagePath === image.storagePath))
          m.publicationImages.push(image);
      if (m.publicationImages.length && m.rights.status === 'public-domain' && m.rights.credit)
        m.rights.publicationApproved = true;
      findings.push({
        id: ref.id,
        text: ref.excerpt,
        status: 'uncertain',
        evidence: [
          { materialId, locator: ref.page || 'Wzmianka bez numeru strony', note: ref.note },
        ],
      });
    }
    for (const tag of p.tags)
      tags.set(tag.id, {
        ...tag,
        description:
          'Tag przeniesiony z wcześniejszej klasyfikacji; bez domyślnego uszczegóławiania.',
        synonyms: [],
      });
    const { references, mentions, published, period, ...rest } = p;
    const qualification = legacyPeriod(p.references);
    const confirmed = ['confirmed', 'probable'].includes(qualification.status);
    const place = {
      ...rest,
      tags: p.tags.map((t) => t.id),
      period: {
        status: qualification.status,
        explanation: qualification.explanation,
        evidence: qualification.proofs.map((proof) => {
          const ref = p.references.find((r) => r.id === proof.referenceId);
          const materialId =
            'mat_' +
            hash(Buffer.from(JSON.stringify([ref.url, ref.title, ref.page, ref.excerpt]))).slice(
              0,
              24,
            );
          return { materialId, locator: ref.page || 'Treść wzmianki', note: proof.note };
        }),
      },
      materialIds: [...new Set(materialIds)],
      findings,
      relatedPlaces: [],
      questions: confirmed ? [] : ['Sprawdzić istnienie w okresie międzywojennym.'],
      publicationApproved: false,
    };
    data[confirmed ? 'places' : 'out-of-period'].push(place);
  }
  data.sources = [...sources.values()];
  data.materials = [...materials.values()];
  data.tags = [...tags.values()];
  data = restructureWorkspace(data);
  validateWorkspace(data);
  const count = Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => [k, v.length]),
  );
  if (!apply) return { preview: true, ...count };
  if (Object.entries(existing).some(([k, v]) => k !== 'config' && Array.isArray(v) && v.length))
    throw new Error(
      'Migration requires an empty workspace; existing research must not be overwritten',
    );
  await atomicWrite(await safePath(root, 'files/legacy-catalog.json'), await readFile(input));
  await atomicWrite(
    await safePath(root, 'files/legacy-source-rights.json'),
    await readFile('.local/source-rights.json'),
  );
  for (const [collection, rows] of Object.entries(data)) {
    if (collection === 'config') continue;
    if (collection === 'tags')
      await atomicWrite(await safePath(root, 'tags.json'), JSON.stringify(rows, null, 2) + '\n');
    else
      for (const row of rows)
        await writeFile(
          await safePath(root, `${collection}/${row.id}.json`),
          JSON.stringify(row, null, 2) + '\n',
          { flag: 'wx' },
        );
  }
  await loadWorkspace(root);
  return { migrated: true, ...count };
}
