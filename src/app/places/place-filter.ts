import { normalizeSearch, type Place } from './place';

export function filterPlaces(
  places: readonly Place[],
  query: string,
  tag: string,
  withoutLocation: boolean,
): readonly Place[] {
  const term = normalizeSearch(query).trim();
  return places.filter(
    (place) =>
      (!withoutLocation || place.location.coordinates === null) &&
      (!tag || place.tags[0]?.id === tag) &&
      normalizeSearch(place.name).includes(term),
  );
}
