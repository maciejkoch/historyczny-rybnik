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
  if (!('category' in place)) return place;
  const { category, ...rest } = place,
    pair = legacyTags[category];
  if (!pair) throw new Error('Unknown legacy category');
  return {
    ...rest,
    tags: [{ id: pair[0], name: pair[1] }],
    period: {
      status: 'unverified',
      explanation:
        'Przeniesiono z wcześniejszego katalogu; kwalifikacja do okresu międzywojennego wymaga sprawdzenia konkretnych wzmianek.',
    },
  };
}
