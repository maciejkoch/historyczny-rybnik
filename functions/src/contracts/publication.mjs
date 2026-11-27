import { placeSchema } from './places.mjs';

// Complete optional fields without inventing required content.
export function publicationCandidate(id, draft, createdAt, updatedAt) {
  const optional = (value) => (value == null || value === '' ? null : value);
  return {
    ...draft,
    id,
    published: true,
    createdAt,
    updatedAt,
    documentedPeriod:
      draft.documentedPeriod?.from || draft.documentedPeriod?.to
        ? { from: draft.documentedPeriod.from, to: optional(draft.documentedPeriod.to) }
        : null,
    existsToday: draft.existsToday ?? null,
    historicalAddress: optional(draft.historicalAddress),
    location:
      draft.location?.coordinates || draft.location?.precision
        ? { ...draft.location, explanation: optional(draft.location.explanation) }
        : {
            coordinates: null,
            precision: null,
            explanation: optional(draft.location?.explanation),
          },
    mentions: (draft.mentions ?? []).map((m) => ({
      ...m,
      publicationDate: optional(m.publicationDate),
      documentedDate:
        m.documentedDate?.from || m.documentedDate?.to
          ? { from: m.documentedDate.from, to: optional(m.documentedDate.to) }
          : null,
      source: optional(m.source),
      sourceUrl: optional(m.sourceUrl),
      sourceNote: optional(m.sourceNote),
      materialIds: m.materialIds ?? [],
    })),
    materials: (draft.materials ?? []).map((m) => ({
      ...m,
      date: optional(m.date),
      source: optional(m.source),
      sourceUrl: optional(m.sourceUrl),
    })),
  };
}
export function validatePublication(id, draft, createdAt, updatedAt) {
  return placeSchema.safeParse(publicationCandidate(id, draft, createdAt, updatedAt));
}
