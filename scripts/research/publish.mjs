import { readFile } from 'node:fs/promises';
import { loadWorkspace, atomicWrite } from './workspace.mjs';
import { catalogSchema } from '../../functions/src/contracts/places.mjs';
export function projectPlace(p, data) {
  if (!p.publicationApproved || !['confirmed', 'probable'].includes(p.period.status))
    throw new Error('Place is not approved for publication');
  const materials = new Map(data.materials.map((m) => [m.id, m]));
  const references = p.findings.flatMap((f) =>
    f.evidence.map((e, index) => {
      const m = materials.get(e.materialId);
      const referenceId = f.evidence.length === 1 ? f.id : `${f.id}_${index + 1}`;
      const images = m.rights.publicationApproved
        ? m.publicationImages.filter(
            (i) =>
              i.storagePath.startsWith('public/materials/') ||
              i.storagePath.startsWith(`public/places/${p.id}/${referenceId}/`),
          )
        : [];
      return {
        id: referenceId,
        title: m.title,
        url: m.url,
        page: e.locator,
        publicationDate: m.publicationDate,
        historicalDate: m.historicalDate,
        accessedAt: m.updatedAt,
        excerpt: f.text,
        excerptType: 'summary',
        note:
          [f.status !== 'confirmed' ? 'Ustalenie wymaga weryfikacji.' : null, e.note]
            .filter(Boolean)
            .join(' ') || null,
        images,
      };
    }),
  );
  if (!references.length) throw new Error('Publication requires at least one sourced finding');
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    previousSlugs: p.previousSlugs,
    description: p.description,
    tags: p.tags.map((id) => {
      const t = data.tags.find((t) => t.id === id);
      return { id: t.id, name: t.name };
    }),
    period: { status: p.period.status, explanation: p.period.explanation },
    aliases: p.aliases,
    addresses: p.addresses,
    district: p.district,
    location: p.location,
    locationVersion: p.locationVersion,
    updatedAt: p.updatedAt,
    createdAt: p.createdAt,
    published: true,
    references,
  };
}
export async function exportCatalog({
  root,
  output,
  apply = false,
  baseline = 'data/places.catalog.json',
}) {
  const data = await loadWorkspace(root);
  const prior = catalogSchema.parse(JSON.parse(await readFile(baseline, 'utf8')));
  const byId = new Map(prior.map((p) => [p.id, p]));
  const changed = [];
  for (const p of data.places.filter((p) => p.publicationApproved)) {
    byId.set(p.id, projectPlace(p, data));
    changed.push(p.id);
  }
  const result = catalogSchema.parse([...byId.values()]);
  if (apply) await atomicWrite(output, JSON.stringify(result, null, 2) + '\n');
  return {
    preview: !apply,
    places: result.length,
    updated: changed,
    output,
    notice:
      'Only approved editorial changes; live locations are preserved by places:import. No database writes performed.',
  };
}
