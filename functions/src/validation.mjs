// Compatibility entry points for catalogue tools; all rules live in shared Zod contracts.
import { z } from 'zod';
import {
  catalogSchema,
  placeSchema,
  partialDateSchema,
  timestampSchema,
  readRequestSchema,
  writeRequestSchema,
} from './contracts/places.mjs';
export const ValidationError = z.ZodError;
export const validatePlace = (value) => placeSchema.parse(value);
export const validateCatalog = (value) => catalogSchema.parse(value);
export const partialDate = (value) => partialDateSchema.parse(value);
export const timestamp = (value) => timestampSchema.parse(value);
export const readRequest = (value) => readRequestSchema.parse(value).ids;
export const writeRequest = (value) => writeRequestSchema.parse(value);
