import { materialMatchesMention } from './chronology.mjs';
import { z } from 'zod';
import {
  idSchema as id,
  partialDateSchema as date,
  timestampSchema,
  locationSchema,
  imageSchema,
} from '../../../functions/src/contracts/places.mjs';
const text = z.string().trim().min(1).max(20000);
const url = z
  .url()
  .max(2000)
  .refine((v) => {
    const u = new URL(v);
    return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
  });
const ids = z
  .array(id)
  .max(1000)
  .refine((a) => new Set(a).size === a.length, 'Duplicate IDs');
const base = { id, updatedAt: timestampSchema };
export const filePath = z
  .string()
  .regex(/^files\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/)
  .refine((s) => !s.split('/').some((p) => p === '.' || p === '..'));
const evidence = z.strictObject({ documentId: id, locator: text, note: text.nullable() });
export const periodSchema = z.strictObject({
  status: z.enum(['confirmed', 'probable', 'unverified', 'outside']),
  explanation: text,
});
const tag = z.strictObject({ id, name: text, description: text, synonyms: z.array(text) });
export const configSchema = z.strictObject({
  schemaVersion: z.literal(3),
  city: z.literal('Rybnik'),
  period: z.strictObject({ from: z.literal(1918), to: z.literal(1939), flexible: z.literal(true) }),
});
export const sourceSchema = z.strictObject({
  ...base,
  name: text,
  url: url.nullable(),
  description: text,
  owner: text.nullable(),
  topics: z.array(text),
  geography: z.array(text),
  coverage: date,
  languages: z.array(text),
  resourceTypes: z.array(text),
  searchInstructions: text.nullable(),
  ocr: z.enum(['yes', 'no', 'unknown']),
  access: z.enum(['public', 'restricted', 'offline', 'unknown']),
  accessNote: text.nullable(),
  rightsNote: text.nullable(),
  rightsUrl: url.nullable(),
  checkedAt: timestampSchema.nullable(),
  discoveredFrom: z.array(z.strictObject({ sourceId: id, locator: text, note: text.nullable() })),
});
export const documentSchema = z.strictObject({
  ...base,
  title: text,
  kind: z.enum(['article', 'newspaper', 'book', 'photo', 'map', 'scan', 'other']),
  temporalContext: z.enum(['contemporary', 'retrospective', 'unknown']).optional(),
  sourceId: id,
  url: url.nullable(),
  identifier: text.nullable(),
  author: text.nullable(),
  publicationDate: date,
  historicalDate: date,
  dateNote: text.nullable(),
  locator: text.nullable(),
  description: text,
  content: z.string().max(200000),
  contentType: z.enum(['quote', 'transcription', 'ocr', 'summary']),
  placeIds: ids,
  parentDocumentId: id.nullable(),
  publicationImages: z.array(imageSchema).max(100),
  rights: z.strictObject({
    status: z.enum(['public-domain', 'licensed', 'restricted', 'unknown']),
    basis: text.nullable(),
    evidenceUrl: url.nullable(),
    evidenceDocumentId: id.nullable().optional(),
    checkedAt: timestampSchema.nullable(),
    credit: text.nullable(),
    publicationApproved: z.boolean(),
  }),
  files: z.array(
    z.strictObject({
      path: filePath,
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      role: z.enum(['original', 'scan', 'crop', 'thumbnail']),
      derivedFrom: filePath.nullable(),
      transformations: text.nullable(),
    }),
  ),
});
export const materialSchema = z.strictObject({
  ...base,
  title: text,
  kind: z.enum(['scan', 'photo', 'postcard', 'map', 'advertisement', 'other']),
  sourceDocumentIds: ids.min(1),
  originalDate: date,
  depictedDate: date,
  datingNote: text,
  classification: z.enum(['historical', 'source-copy', 'unidentified', 'outside-period']),
  rights: documentSchema.shape.rights,
  files: documentSchema.shape.files.min(1),
  publicationImages: z.array(imageSchema).max(100),
});
export const mentionSchema = z
  .strictObject({
    ...base,
    placeId: id,
    text,
    documentedDate: date,
    verification: z.enum(['verified', 'draft', 'conflicting']),
    verificationNote: text,
    verifiedAt: timestampSchema.nullable(),
    evidence: z.array(evidence).min(1),
    materialIds: ids,
  })
  .superRefine((m, ctx) => {
    if (m.verification === 'verified' && (!m.documentedDate || !m.verifiedAt))
      ctx.addIssue({
        code: 'custom',
        message: 'Verified mention requires documented date and verification time',
      });
  });
export const placeSchema = z.strictObject({
  ...base,
  name: text,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  previousSlugs: z.array(text),
  description: z.string().max(20000),
  aliases: z.array(text),
  addresses: z.array(z.strictObject({ type: z.enum(['historical', 'current']), text })),
  district: text.nullable(),
  location: locationSchema,
  locationVersion: z.number().int().nonnegative(),
  createdAt: timestampSchema,
  tags: ids.min(1),
  period: periodSchema,
  mentionIds: ids,
  relatedPlaces: z.array(
    z.strictObject({ placeId: id, note: text.nullable(), documentId: id.nullable() }),
  ),
  questions: z.array(text),
  publicationApproved: z.boolean(),
});
export const candidateSchema = z.strictObject({
  ...base,
  name: text,
  reason: text,
  context: text,
  evidence: z.array(evidence).min(1),
  relatedPlaceIds: ids,
  possibleDuplicateIds: ids,
  location: locationSchema,
  status: z.enum(['pending', 'accepted', 'rejected', 'merged']),
  decisionNote: text.nullable(),
  resolvedPlaceId: id.nullable(),
});
export const researchSchema = z.strictObject({
  ...base,
  context: text,
  startedAt: timestampSchema,
  completedAt: timestampSchema.nullable(),
  placeIds: ids,
  searches: z.array(
    z.strictObject({
      query: text,
      sourceId: id.nullable(),
      locator: text.nullable(),
      outcome: z.enum(['found', 'no-results', 'unavailable']),
      note: text,
    }),
  ),
  changes: z.array(
    z.strictObject({
      collection: z.enum([
        'sources',
        'documents',
        'mentions',
        'materials',
        'places',
        'candidates',
        'out-of-period',
        'tags',
      ]),
      id,
      action: z.enum(['added', 'updated', 'moved']),
    }),
  ),
  leads: z.array(
    z.strictObject({
      url: url.nullable(),
      sourceId: id.nullable(),
      note: text,
      status: z.enum(['pending', 'checked', 'unavailable']),
    }),
  ),
  limitations: z.array(text),
  summary: text,
});
export const schemas = {
  sources: sourceSchema,
  documents: documentSchema,
  mentions: mentionSchema,
  materials: materialSchema,
  places: placeSchema,
  'out-of-period': placeSchema,
  candidates: candidateSchema,
  research: researchSchema,
};
export const tagsSchema = z.array(tag).max(1000);

export function validateWorkspace(input) {
  const data = { config: configSchema.parse(input.config), tags: tagsSchema.parse(input.tags) };
  for (const [key, schema] of Object.entries(schemas))
    data[key] = z.array(schema).max(10000).parse(input[key]);
  const sets = {};
  for (const [key, rows] of Object.entries(data)) {
    if (!Array.isArray(rows)) continue;
    sets[key] = new Set(rows.map((r) => r.id));
    if (sets[key].size !== rows.length) throw new Error(`Duplicate ID: ${key}`);
  }
  const places = [...data.places, ...data['out-of-period']];
  const allPlaces = new Set(places.map((p) => p.id));
  if (allPlaces.size !== places.length) throw new Error('Place exists in two folders');
  const need = (set, id) => {
    if (!set.has(id)) throw new Error(`Broken reference: ${id}`);
  };
  const ev = (e) => need(sets.documents, e.documentId);
  const labels = new Set();
  for (const t of data.tags)
    for (const name of [t.name, ...t.synonyms]) {
      const normalized = name.normalize('NFC').toLocaleLowerCase('pl');
      if (labels.has(normalized)) throw new Error(`Duplicate tag name/synonym: ${name}`);
      labels.add(normalized);
    }
  const globalIds = new Set();
  for (const rows of Object.values(data).filter(Array.isArray))
    for (const row of rows) {
      if (globalIds.has(row.id)) throw new Error(`ID reused across collections: ${row.id}`);
      globalIds.add(row.id);
    }
  const sourceUrls = data.sources.map((s) => s.url).filter(Boolean);
  if (new Set(sourceUrls).size !== sourceUrls.length) throw new Error('Duplicate source URL');
  const documents = new Map(data.documents.map((m) => [m.id, m]));
  const materials = new Map(data.materials.map((m) => [m.id, m]));
  const mentions = new Map(data.mentions.map((m) => [m.id, m]));
  for (const s of data.sources) for (const d of s.discoveredFrom) need(sets.sources, d.sourceId);
  for (const d of data.documents) {
    need(sets.sources, d.sourceId);
    d.placeIds.forEach((p) => need(allPlaces, p));
    if (d.parentDocumentId) need(sets.documents, d.parentDocumentId);
    const visited = new Set([d.id]);
    let parent = d.parentDocumentId;
    while (parent) {
      if (visited.has(parent)) throw new Error('Document ancestry cycle');
      visited.add(parent);
      parent = documents.get(parent).parentDocumentId;
    }
  }
  for (const m of [...data.documents, ...data.materials]) {
    if (m.rights.evidenceDocumentId) need(sets.documents, m.rights.evidenceDocumentId);
    if (
      m.rights.publicationApproved &&
      (m.rights.status !== 'public-domain' ||
        !m.rights.basis ||
        (!m.rights.evidenceUrl && !m.rights.evidenceDocumentId) ||
        !m.rights.checkedAt ||
        !m.rights.credit)
    )
      throw new Error(`Publication rights not evidenced: ${m.id}`);
  }
  for (const m of data.materials) {
    m.sourceDocumentIds.forEach((id) => need(sets.documents, id));
    if (m.classification === 'historical' && !(m.depictedDate || m.originalDate))
      throw new Error('Historical material requires dating');
    if (m.classification !== 'historical' && m.rights.publicationApproved)
      throw new Error('Only historical material can be approved');
  }
  for (const m of data.mentions) {
    need(allPlaces, m.placeId);
    m.evidence.forEach(ev);
    for (const id of m.materialIds) {
      need(sets.materials, id);
      if (!materialMatchesMention(materials.get(id), m))
        throw new Error('Material does not match verified mention period');
    }
  }
  const paths = new Map();
  for (const m of [...data.documents, ...data.materials])
    for (const f of m.files) {
      if (paths.has(f.path) && paths.get(f.path) !== f.sha256)
        throw new Error('Conflicting file hash');
      paths.set(f.path, f.sha256);
    }
  for (const m of [...data.documents, ...data.materials])
    for (const f of m.files)
      if (f.derivedFrom && !paths.has(f.derivedFrom))
        throw new Error(`Missing original file: ${f.derivedFrom}`);
  const slugs = new Set();
  for (const p of places) {
    for (const slug of [p.slug, ...p.previousSlugs]) {
      if (slugs.has(slug)) throw new Error(`Slug collision: ${slug}`);
      slugs.add(slug);
    }
    p.tags.forEach((t) => need(sets.tags, t));
    for (const id of p.mentionIds) {
      need(sets.mentions, id);
      if (mentions.get(id).placeId !== p.id) throw new Error('Mention belongs to another place');
    }

    for (const r of p.relatedPlaces) {
      need(allPlaces, r.placeId);
      if (r.placeId === p.id) throw new Error('Self relation');
      if (r.documentId) need(sets.documents, r.documentId);
    }
    if (
      p.period.status === 'confirmed' &&
      !p.mentionIds.some((id) => {
        const m = mentions.get(id);
        return (
          m.verification === 'verified' &&
          m.documentedDate &&
          Number(m.documentedDate.from.slice(0, 4)) <= data.config.period.to &&
          Number((m.documentedDate.to || m.documentedDate.from).slice(0, 4)) >=
            data.config.period.from
        );
      })
    )
      throw new Error(`No period evidence: ${p.id}`);
    if (data.places.includes(p) !== ['confirmed', 'probable'].includes(p.period.status))
      throw new Error(`Wrong period folder: ${p.id}`);
    if (data['out-of-period'].includes(p) && p.publicationApproved)
      throw new Error('Outside/unverified place cannot be published');
  }
  for (const c of data.candidates) {
    c.evidence.forEach(ev);
    [...c.relatedPlaceIds, ...c.possibleDuplicateIds].forEach((p) => need(allPlaces, p));
    if (c.resolvedPlaceId) need(allPlaces, c.resolvedPlaceId);
    if (c.status !== 'pending' && !c.decisionNote) throw new Error('Candidate decision missing');
    if (['accepted', 'merged'].includes(c.status) && !c.resolvedPlaceId)
      throw new Error('Candidate resolution missing');
  }
  for (const r of data.research) {
    r.placeIds.forEach((p) => need(allPlaces, p));
    for (const s of [...r.searches, ...r.leads]) if (s.sourceId) need(sets.sources, s.sourceId);
    for (const c of r.changes)
      need(
        ['places', 'out-of-period'].includes(c.collection) ? allPlaces : sets[c.collection],
        c.id,
      );
  }
  return data;
}
