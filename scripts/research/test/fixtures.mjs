export const stamp = '2026-11-08T08:00:00Z';
export const unknownLocation = { coordinates: null, precision: 'unknown', explanation: null };
const date = (year) => ({ from: year, to: null, approximate: false });
export function fixture() {
  const sources = ['a', 'b', 'c'].map((id, i) => ({
    id: 'src_' + id,
    updatedAt: stamp,
    name: 'Fikcyjne źródło ' + id,
    url: 'https://example.org/' + id,
    description: 'Wyłącznie fixture testowe',
    owner: null,
    topics: ['Rybnik'],
    geography: ['Rybnik'],
    coverage: null,
    languages: ['pl'],
    resourceTypes: ['gazety'],
    searchInstructions: null,
    ocr: 'unknown',
    access: 'public',
    accessNote: null,
    rightsNote: null,
    rightsUrl: null,
    checkedAt: null,
    discoveredFrom: i
      ? [{ sourceId: 'src_' + ['a', 'b'][i - 1], locator: 'Przypis 1', note: null }]
      : [],
  }));
  const materials = ['a', 'b'].map((id, i) => ({
    id: 'mat_' + id,
    updatedAt: stamp,
    title: 'Fikcyjny materiał ' + id,
    kind: 'article',
    sourceId: 'src_' + id,
    url: 'https://example.org/material/' + id,
    identifier: null,
    author: null,
    publicationDate: date(i ? '1950' : '1890'),
    historicalDate: i ? date('1932') : null,
    dateNote: null,
    locator: '17',
    description: 'Dane testowe',
    content: 'Testowy odczyt',
    contentType: 'summary',
    placeIds: ['place_a'],
    parentMaterialId: null,
    publicationImages: [],
    rights: {
      status: 'unknown',
      basis: null,
      evidenceUrl: null,
      evidenceMaterialId: null,
      checkedAt: null,
      credit: null,
      publicationApproved: false,
    },
    files: [],
  }));
  const evidence = [{ materialId: 'mat_b', locator: 'str. 17', note: null }];
  const place = {
    id: 'place_a',
    updatedAt: stamp,
    name: 'Fikcyjne miejsce A',
    slug: 'fikcyjne-a',
    previousSlugs: [],
    description: 'Przykład testowy',
    aliases: [],
    addresses: [],
    district: null,
    location: {
      coordinates: { lat: 50.096, lng: 18.542 },
      precision: 'approximate',
      explanation: 'Fixture',
    },
    locationVersion: 0,
    createdAt: stamp,
    tags: ['uslugi', 'fryzjer'],
    period: { status: 'confirmed', explanation: 'Artykuł 1950 wprost opisuje rok 1932', evidence },
    materialIds: ['mat_a', 'mat_b'],
    findings: [
      { id: 'finding_a', text: 'Fikcyjny zakład istniał w 1932', status: 'confirmed', evidence },
    ],
    relatedPlaces: [],
    questions: [],
    publicationApproved: false,
  };
  return {
    config: { schemaVersion: 2, city: 'Rybnik', period: { from: 1918, to: 1939, flexible: true } },
    tags: [
      { id: 'uslugi', name: 'usługi', description: 'Usługi', synonyms: [] },
      { id: 'fryzjer', name: 'fryzjer', description: 'Fryzjer', synonyms: ['zakład fryzjerski'] },
    ],
    sources,
    materials,
    places: [place],
    'out-of-period': [],
    candidates: [
      {
        id: 'candidate_c',
        updatedAt: stamp,
        name: 'Fikcyjny sąsiad C',
        reason: 'Wspomniany w artykule',
        context: 'Badanie A',
        evidence,
        relatedPlaceIds: ['place_a'],
        possibleDuplicateIds: [],
        location: unknownLocation,
        status: 'pending',
        decisionNote: null,
        resolvedPlaceId: null,
      },
    ],
    research: [
      {
        id: 'run_a',
        updatedAt: stamp,
        context: 'Fikcyjne badanie fryzjerów',
        startedAt: stamp,
        completedAt: stamp,
        placeIds: ['place_a'],
        searches: [
          {
            query: 'A przed 1950',
            sourceId: 'src_b',
            locator: 'str.17',
            outcome: 'found',
            note: 'Opisuje 1932',
          },
          {
            query: 'A po 1890',
            sourceId: 'src_a',
            locator: null,
            outcome: 'no-results',
            note: 'Nie znaleziono dalszych dat',
          },
        ],
        changes: [
          { collection: 'places', id: 'place_a', action: 'added' },
          { collection: 'candidates', id: 'candidate_c', action: 'added' },
        ],
        leads: [
          {
            url: 'https://example.org/c',
            sourceId: 'src_c',
            note: 'Sprawdzić dalszą bibliografię',
            status: 'pending',
          },
        ],
        limitations: ['Prawa materiałów nieustalone'],
        summary: 'Fikcyjne badanie: dodano A i kandydata C, odkryto źródła B i C.',
      },
    ],
  };
}
