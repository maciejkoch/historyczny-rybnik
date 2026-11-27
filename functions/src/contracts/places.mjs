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
  precision: z.enum(['exact', 'approximate']),
  explanation: z.string().max(2000).nullable(),
});
export const locationSchema = z.union([
  knownLocationSchema,
  z.strictObject({
    coordinates: z.null(),
    precision: z.null(),
    explanation: text(2000).nullable(),
  }),
]);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const assetPath = text(500).regex(
  /^public\/materials\/[a-zA-Z0-9_-]{1,100}\/[a-zA-Z0-9_-]+\.(webp|png|jpg)$/,
);
const referenceUrl = text(2000).refine((value) => {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password;
  } catch {
    return false;
  }
}, 'HTTP(S) source URL without credentials required');
export const placeMaterialSchema = z.strictObject({
  materialId: idSchema,
  date: historicalDateSchema.nullable(),
  storagePath: assetPath,
  thumbnailPath: assetPath,
  width: z.number().int().positive().max(30000),
  height: z.number().int().positive().max(30000),
  alt: text(500),
  source: text(500).nullable(),
  sourceUrl: referenceUrl.nullable(),
  sha256,
  thumbnailSha256: sha256,
  isPrimary: z.boolean(),
});
export const mentionSchema = z.strictObject({
  id: idSchema,
  title: text(500),
  description: text(10000),
  publicationDate: historicalDateSchema.nullable(),
  documentedDate: partialDateSchema,
  source: text(500).nullable(),
  sourceUrl: referenceUrl.nullable(),
  sourceNote: text(2000).nullable(),
  materialIds: z.array(idSchema).max(100),
});
const placeFields = {
  id: idSchema,
  name: text(200),
  slug: slugSchema,
  description: text(20000),
  tags: z
    .array(z.strictObject({ id: idSchema, name: text(200) }))
    .min(1)
    .max(100)
    .refine((v) => new Set(v.map((t) => t.id)).size === v.length, 'Duplicate tags'),
  documentedPeriod: partialDateSchema,
  existsToday: z.boolean().nullable(),
  historicalAddress: text(500).nullable(),
  location: locationSchema,
  mentions: z.array(mentionSchema).max(100),
  materials: z.array(placeMaterialSchema).max(100),
  updatedAt: timestampSchema,
};
const basePlaceSchema = z.strictObject(placeFields);
export const publicSummarySchema = basePlaceSchema.pick({
  id: true,
  name: true,
  slug: true,
  tags: true,
  historicalAddress: true,
  location: true,
  updatedAt: true,
});
/** @param {{materials: {materialId:string,isPrimary:boolean,storagePath:string,thumbnailPath:string}[], mentions: {id:string,materialIds:string[]}[]}} place @param {z.RefinementCtx} ctx */
function placeRelations(place, ctx) {
  const ids = new Set(place.materials.map((m) => m.materialId));
  if (ids.size !== place.materials.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate material', path: ['materials'] });
  place.materials.forEach((m, i) => {
    for (const path of [m.storagePath, m.thumbnailPath])
      if (!path.startsWith(`public/materials/${m.materialId}/`))
        ctx.addIssue({
          code: 'custom',
          message: 'Asset belongs to another material',
          path: ['materials', i],
        });
  });
  if (place.materials.filter((m) => m.isPrimary).length > 1)
    ctx.addIssue({ code: 'custom', message: 'Only one primary material', path: ['materials'] });
  if (new Set(place.mentions.map((m) => m.id)).size !== place.mentions.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate mention', path: ['mentions'] });
  place.mentions.forEach((m, i) => {
    if (
      new Set(m.materialIds).size !== m.materialIds.length ||
      m.materialIds.some((id) => !ids.has(id))
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid material references',
        path: ['mentions', i, 'materialIds'],
      });
  });
  if (new TextEncoder().encode(JSON.stringify(place)).byteLength > 700000)
    ctx.addIssue({ code: 'custom', message: 'Document too large' });
}
export const publicPlaceSchema = basePlaceSchema.superRefine(placeRelations);
export const placeSchema = z
  .strictObject({ ...placeFields, published: z.boolean(), createdAt: timestampSchema })
  .superRefine(placeRelations);
/** @param {any[]} places @param {z.RefinementCtx} ctx */
function catalogRelations(places, ctx) {
  for (const key of ['id', 'slug'])
    if (new Set(places.map((p) => p[key])).size !== places.length)
      ctx.addIssue({ code: 'custom', message: 'Duplicate ' + key });
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
export const locationDtoSchema = z.strictObject({
  id: idSchema,
  location: locationSchema,
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
