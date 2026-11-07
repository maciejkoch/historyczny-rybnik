// Runtime contracts shared with Angular and catalogue tools. Keep this module SDK-free.
import { z } from 'zod';

/** @param {number} max */
const text = (max) =>
  z.string().refine((v) => v.trim().length > 0 && v.length <= max, 'Invalid text');
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const slugSchema = z
  .string()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const versionSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const httpsUrl = text(2000).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}, 'HTTPS URL without credentials required');
export const timestampSchema = z.string().refine((value) => {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    return false;
  return new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z');
}, 'Invalid UTC timestamp');

/** @param {string} value */
function dateBounds(value) {
  if (!/^\d{4}(-\d{2})?(-\d{2})?$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000 || year > 2999 || (month !== undefined && (month < 1 || month > 12))) return null;
  if (day !== undefined && (day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()))
    return null;
  return [
    Date.UTC(year, (month ?? 1) - 1, day ?? 1),
    Date.UTC(
      year,
      (month ?? 12) - 1,
      day ?? (month ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 31),
    ),
  ];
}
const historicalDateSchema = z
  .string()
  .refine((v) => dateBounds(v) !== null, 'Invalid historical date');
export const partialDateSchema = z
  .strictObject({
    from: historicalDateSchema,
    to: historicalDateSchema.nullable(),
    approximate: z.boolean(),
  })
  .refine(
    (value) => {
      const from = dateBounds(value.from),
        to = dateBounds(value.to ?? value.from);
      return !from || !to || from[0] <= to[1];
    },
    { message: 'Invalid date range', path: ['to'] },
  )
  .nullable();

const coordinatesSchema = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const knownLocationSchema = z.strictObject({
  coordinates: coordinatesSchema,
  precision: z.enum(['building', 'approximate']),
  explanation: z.string().max(2000),
});
export const locationSchema = z.union([
  knownLocationSchema,
  z.strictObject({
    coordinates: z.null(),
    precision: z.literal('unknown'),
    explanation: text(2000).nullable(),
  }),
]);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const assetPath = text(500).regex(
  /^public\/places\/[a-zA-Z0-9_-]{1,100}\/[a-zA-Z0-9_-]{1,100}\/[a-zA-Z0-9_-]+\.(webp|png|jpg)$/,
);
export const imageSchema = z.strictObject({
  storagePath: assetPath,
  thumbnailPath: assetPath,
  alt: text(500),
  credit: text(500),
  rights: text(2000),
  sha256,
  thumbnailSha256: sha256,
  provenance: z.strictObject({
    title: text(500),
    sourcePageUrl: httpsUrl,
    originalCollectionUrl: httpsUrl,
    originalImageUrl: httpsUrl,
    originalSha256: sha256,
    author: text(500),
    dateNote: text(500),
    license: text(500),
    licenseUrl: httpsUrl,
    copyrighted: z.boolean(),
    rightsCheckedAt: historicalDateSchema.refine(
      (v) => /^\d{4}-\d{2}-\d{2}$/.test(v),
      'Full date required',
    ),
    transformations: text(2000),
  }),
});
export const referenceSchema = z.strictObject({
  id: idSchema,
  title: text(500),
  url: httpsUrl.nullable(),
  page: text(100).nullable(),
  publicationDate: partialDateSchema,
  historicalDate: partialDateSchema,
  accessedAt: timestampSchema,
  excerpt: text(10000),
  excerptType: z.enum(['quote', 'transcription', 'summary']),
  note: text(2000).nullable(),
  images: z.array(imageSchema).max(10),
});
const placeFields = {
  id: idSchema,
  name: text(200),
  slug: slugSchema,
  previousSlugs: z.array(slugSchema).max(30),
  description: text(20000),
  category: z.enum(['industry', 'commerce', 'religion', 'education', 'public', 'culture', 'other']),
  aliases: z.array(text(200)).max(30),
  addresses: z
    .array(z.strictObject({ type: z.enum(['historical', 'current']), text: text(500) }))
    .max(30),
  district: text(200).nullable(),
  location: locationSchema,
  references: z.array(referenceSchema).max(100),
  locationVersion: versionSchema,
  updatedAt: timestampSchema,
};
const basePlaceSchema = z.strictObject(placeFields);
/** @param {{id: string, references: {id: string, images: {storagePath: string, thumbnailPath: string}[]}[]}} place
 * @param {z.RefinementCtx} ctx */
function placeRelations(place, ctx) {
  const refs = new Set();
  place.references.forEach((ref, index) => {
    if (refs.has(ref.id))
      ctx.addIssue({
        code: 'custom',
        message: 'Duplicate reference',
        path: ['references', index, 'id'],
      });
    refs.add(ref.id);
    ref.images.forEach((image, imageIndex) => {
      for (const key of /** @type {const} */ (['storagePath', 'thumbnailPath'])) {
        if (!image[key].startsWith(`public/places/${place.id}/${ref.id}/`))
          ctx.addIssue({
            code: 'custom',
            message: 'Asset belongs to another place or reference',
            path: ['references', index, 'images', imageIndex, key],
          });
      }
    });
  });
  // Same UTF-8 limit in Node and browser; no Node Buffer in shared contracts.
  if (new TextEncoder().encode(JSON.stringify(place)).byteLength > 700000)
    ctx.addIssue({ code: 'custom', message: 'Document too large' });
}
export const publicPlaceSchema = basePlaceSchema.superRefine(placeRelations);
export const placeSchema = z
  .strictObject({ ...placeFields, published: z.boolean(), createdAt: timestampSchema })
  .superRefine(placeRelations);

/** @param {{id: string, slug: string, previousSlugs: string[]}[]} places
 * @param {z.RefinementCtx} ctx */
function catalogRelations(places, ctx) {
  const ids = new Set(),
    slugs = new Set();
  places.forEach((place, index) => {
    if (ids.has(place.id))
      ctx.addIssue({ code: 'custom', message: 'Duplicate place', path: [index, 'id'] });
    ids.add(place.id);
    for (const slug of [place.slug, ...place.previousSlugs]) {
      if (slugs.has(slug))
        ctx.addIssue({ code: 'custom', message: 'Slug collision', path: [index, 'slug'] });
      slugs.add(slug);
    }
  });
}
export const catalogSchema = z.array(placeSchema).max(1000).superRefine(catalogRelations);
export const publicCatalogSchema = z
  .array(publicPlaceSchema)
  .max(1000)
  .superRefine(catalogRelations);
export const readRequestSchema = z.strictObject({
  ids: z
    .array(idSchema)
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, 'Duplicate IDs'),
});
export const writeRequestSchema = z.strictObject({
  placeId: idSchema,
  expectedLocationVersion: versionSchema.max(Number.MAX_SAFE_INTEGER - 1),
  location: knownLocationSchema,
});
export const locationDtoSchema = z.strictObject({
  id: idSchema,
  location: locationSchema,
  locationVersion: versionSchema,
  updatedAt: timestampSchema,
});
export const readResponseSchema = z.strictObject({
  places: z
    .array(locationDtoSchema)
    .max(100)
    .refine(
      (places) => new Set(places.map((p) => p.id)).size === places.length,
      'Duplicate places',
    ),
});
/** Validate the entire payload before any of it reaches client state.
 * @param {unknown} data
 * @param {readonly string[]} requestedIds */
export function parseReadResponse(data, requestedIds) {
  const requested = new Set(readRequestSchema.parse({ ids: [...requestedIds] }).ids);
  return readResponseSchema
    .refine((response) => response.places.every((p) => requested.has(p.id)), 'Unexpected place ID')
    .parse(data);
}
