import { publicationImages } from './assets.mjs';
import { readFile } from 'node:fs/promises';
import { loadWorkspace, atomicWrite } from '../workspace/files.mjs';
import { catalogSchema } from '../../../functions/src/contracts/places.mjs';
import { materialMatchesMention } from '../model/chronology.mjs';
export function projectPlace(p, data) {
  if (!p.publicationApproved || !['confirmed', 'probable'].includes(p.period.status))
    throw new Error('Place is not approved for publication');
  const documents = new Map(data.documents.map((m) => [m.id, m]));
  const mentions = p.mentionIds
    .map((id) => data.mentions.find((m) => m.id === id))
    .filter((m) => m.verification === 'verified')
    .flatMap((m) =>
      m.evidence.map((e, i) => {
        const d = documents.get(e.documentId);
        const materials = m.materialIds
          .map((id) => data.materials.find((v) => v.id === id))
          .filter((v) => materialMatchesMention(v, m) && v.rights.publicationApproved)
          .flatMap((v) =>
            publicationImages(v).map((image) => ({
              ...image,
              materialId: v.id,
              documentedDate: v.depictedDate || v.originalDate,
            })),
          );
        return {
          id: i ? `${m.id}_${i}` : m.id,
          title: d.title,
          url: d.url,
          page: e.locator,
          publicationDate: d.publicationDate,
          documentedDate: m.documentedDate,
          verification: 'verified',
          accessedAt: m.verifiedAt,
          excerpt: m.text,
          excerptType: 'summary',
          note: e.note,
          materials,
        };
      }),
    );
  if (!mentions.length) throw new Error('Publication requires a dated verified mention');
  const { period } = p;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    previousSlugs: p.previousSlugs,
    description: p.description,
    aliases: p.aliases,
    addresses: p.addresses,
    district: p.district,
    location: p.location,
    locationVersion: p.locationVersion,
    updatedAt: p.updatedAt,
    createdAt: p.createdAt,
    tags: p.tags.map((id) => {
      const t = data.tags.find((t) => t.id === id);
      return { id: t.id, name: t.name };
    }),
    period: { status: period.status, explanation: period.explanation },
    published: true,
    mentions,
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
      'Only approved editorial changes and dated verified mentions. No database writes performed.',
  };
}
