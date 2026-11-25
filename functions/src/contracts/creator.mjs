import { z } from 'zod';
import { idSchema, knownLocationSchema, mentionSchema, partialDateSchema, placeMaterialSchema, placeSchema, timestampSchema } from './places.mjs';

// The draft uses the same field names as the published model, while accepting
// incomplete values and retaining only type, field and resource limits.
const draftText = (max) => z.string().max(max).nullish();
const draftNumber = z.number().finite().nullish();
const draftBoolean = z.boolean().nullish();
const draftPeriod = z.strictObject(partialDateSchema.unwrap().shape).extend({ from: draftText(32), to: draftText(32) }).partial().nullish();
const draftLocation = z.strictObject(knownLocationSchema.shape).extend({
  coordinates: z.strictObject(knownLocationSchema.shape.coordinates.shape).extend({ lat: draftNumber, lng: draftNumber }).partial().nullish(),
  precision: draftText(32), explanation: draftText(2000),
}).partial().nullish();
const draftTag = z.strictObject(placeSchema.shape.tags.element.shape).extend({ id: draftText(100), name: draftText(200) }).partial();
export const draftMentionSchema = mentionSchema.extend({
  id: draftText(100), title: draftText(500), description: draftText(10000),
  publicationDate: draftText(32), documentedDate: draftPeriod, source: draftText(500),
  sourceUrl: draftText(2000), sourceNote: draftText(2000),
  materialIds: z.array(z.string().max(100)).max(100).nullish(),
}).partial();
export const draftMaterialSchema = placeMaterialSchema.extend({
  materialId: draftText(100), date: draftText(32), storagePath: draftText(500),
  thumbnailPath: draftText(500), width: draftNumber, height: draftNumber, alt: draftText(500),
  source: draftText(500), sourceUrl: draftText(2000), sha256: draftText(64),
  thumbnailSha256: draftText(64), isPrimary: draftBoolean,
}).partial();
export const draftDataSchema = z.strictObject(placeSchema.shape).omit({ id: true, published: true, createdAt: true, updatedAt: true }).extend({
  name: draftText(200), slug: draftText(100), description: draftText(20000),
  tags: z.array(draftTag).max(100).nullish(), documentedPeriod: draftPeriod,
  existsToday: draftBoolean, historicalAddress: draftText(500), location: draftLocation,
  mentions: z.array(draftMentionSchema).max(100).nullish(),
  materials: z.array(draftMaterialSchema).max(100).nullish(),
}).partial().refine((value) => new TextEncoder().encode(JSON.stringify(value)).byteLength <= 700000, 'Document too large');
export const creatorIdRequestSchema = z.strictObject({ id: idSchema });
export const creatorEmptyRequestSchema = z.strictObject({});
export const draftResponseSchema = z.strictObject({ id: idSchema, data: draftDataSchema, createdAt: timestampSchema, updatedAt: timestampSchema });
export const creatorListResponseSchema = z.strictObject({ places: z.array(z.strictObject({
  id: idSchema, name: z.string().max(200), status: z.enum(['published', 'modified', 'draft']),
})).max(2000) });
