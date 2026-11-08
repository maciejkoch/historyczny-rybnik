import { legacyTemporalContext } from './legacy-period.mjs';
// Explicit migration mapping: broad legacy categories are not inferred detailed historical tags.
export const legacyTags = {
  industry: ['przemysl', 'przemysł'],
  commerce: ['handel', 'handel'],
  religion: ['obiekt-sakralny', 'obiekt sakralny'],
  education: ['edukacja', 'edukacja'],
  public: ['instytucja-publiczna', 'instytucja publiczna'],
  culture: ['kultura', 'kultura'],
  other: ['inne', 'inne'],
};
export function upgradePlace(place) {
  if (!('category' in place)) return upgradeMentions(place);
  const { category, ...rest } = place,
    pair = legacyTags[category];
  if (!pair) throw new Error('Unknown legacy category');
  return upgradeMentions({
    ...rest,
    tags: [{ id: pair[0], name: pair[1] }],
    period: {
      status: 'unverified',
      explanation:
        'Przeniesiono z wcześniejszego katalogu; kwalifikacja do okresu międzywojennego wymaga sprawdzenia konkretnych wzmianek.',
    },
  });
}

export function upgradeMentions(place) {
  if (!place.references) return place;
  const { references, ...rest } = place;
  return {
    ...rest,
    mentions: references.map((ref) => {
      const { historicalDate, images, ...source } = ref;
      const postcard = ref.url?.includes('Antoniuskirche._1919_');
      const documentedDate =
        historicalDate ||
        (postcard ? ref.publicationDate : null) ||
        (legacyTemporalContext(ref) === 'contemporary' ? ref.publicationDate : null);
      const verification =
        documentedDate &&
        (legacyTemporalContext(ref) === 'contemporary' || postcard) &&
        !/nie rozstrzy|niepewn|przypuszcz|wymaga.*sprawdz/i.test(ref.note || '')
          ? 'verified'
          : 'draft';
      return {
        ...source,
        documentedDate,
        verification,
        materials:
          verification === 'verified' && (legacyTemporalContext(ref) === 'contemporary' || postcard)
            ? images.map((image) => ({
                ...image,
                materialId: 'vis_' + image.sha256.slice(0, 32),
                documentedDate: ref.publicationDate,
              }))
            : [],
      };
    }),
  };
}
