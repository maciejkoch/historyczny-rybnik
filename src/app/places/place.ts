import type { z } from 'zod';
import type {
  partialDateSchema,
  locationSchema,
  mentionSchema,
  publicPlaceSchema,
  locationDtoSchema,
  readRequestSchema,
  writeRequestSchema,
} from '../../../functions/src/contracts/places.mjs';

type DeepReadonly<T> = T extends readonly unknown[]
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;
export type PartialDate = DeepReadonly<NonNullable<z.infer<typeof partialDateSchema>>>;
export type PlaceLocation = DeepReadonly<z.infer<typeof locationSchema>>;
export type PlaceMention = DeepReadonly<z.infer<typeof mentionSchema>>;
export type Place = DeepReadonly<z.infer<typeof publicPlaceSchema>>;
export type LocationDto = DeepReadonly<z.infer<typeof locationDtoSchema>>;
export type ReadLocationsRequest = z.infer<typeof readRequestSchema>;
export type UpdateLocationRequest = z.infer<typeof writeRequestSchema>;

export const normalizeSearch = (value: string): string =>
  value
    .toLocaleLowerCase('pl')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/g, 'l');
