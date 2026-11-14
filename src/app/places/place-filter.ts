import { normalizeSearch, type PlaceSummary } from './place';

export function filterPlaces(
  places: readonly PlaceSummary[],
  query: string,
  tag: string,
  withoutLocation: boolean,
): readonly PlaceSummary[] {
  const term = normalizeSearch(query).trim();
  return places.filter(
    (place) =>
      (!withoutLocation || place.location.coordinates === null) &&
      (!tag || place.tags[0]?.id === tag) &&
      normalizeSearch(place.name).includes(term),
  );
}
