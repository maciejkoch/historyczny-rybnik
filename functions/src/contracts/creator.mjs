import { z } from 'zod';
import { idSchema, locationSchema, mentionSchema, placeMaterialSchema, partialDateSchema, timestampSchema } from './places.mjs';

export const draftDataSchema = z.strictObject({
  name: z.string().max(200), slug: z.string().max(100), description: z.string().max(20000),
  tags: z.array(z.strictObject({ id: idSchema, name: z.string().max(200) })).max(100),
  documentedPeriod: partialDateSchema, existsToday: z.boolean().nullable(),
  historicalAddress: z.string().max(500).nullable(), location: locationSchema,
  mentions: z.array(mentionSchema).max(100), materials: z.array(placeMaterialSchema).max(100),
});
export const creatorIdRequestSchema = z.strictObject({ id: idSchema });
export const creatorEmptyRequestSchema = z.strictObject({});
export const draftResponseSchema = z.strictObject({ id: idSchema, data: draftDataSchema, createdAt: timestampSchema, updatedAt: timestampSchema });
export const creatorListResponseSchema = z.strictObject({ places: z.array(z.strictObject({
  id: idSchema, name: z.string().max(200), status: z.enum(['published', 'modified', 'draft']),
})).max(2000) });
