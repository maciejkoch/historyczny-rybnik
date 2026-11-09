import type { Place } from '../places/place';

export const MARKER_CATEGORIES = [
  { id: 'handel', name: 'Handel', icon: 'store' },
  { id: 'edukacja', name: 'Edukacja', icon: 'graduation-cap' },
  { id: 'obiekt-sakralny', name: 'Obiekt sakralny', icon: 'church' },
  { id: 'kultura', name: 'Kultura', icon: 'theater' },
  { id: 'instytucja-publiczna', name: 'Instytucja publiczna', icon: 'landmark' },
  { id: 'stacja-benzynowa', name: 'Stacja benzynowa', icon: 'fuel' },
  { id: 'uslugi', name: 'Usługi', icon: 'settings' },
  { id: 'przemysl', name: 'Przemysł', icon: 'factory' },
  { id: 'inne', name: 'Inne', icon: 'map-pin' },
] as const;

export function markerCategory(place: Pick<Place, 'tags'>) {
  // Order is editorial data: only the first tag chooses the marker.
  return (
    MARKER_CATEGORIES.find((category) => category.id === place.tags[0]?.id) ??
    MARKER_CATEGORIES[MARKER_CATEGORIES.length - 1]
  );
}

export function markerIcon(icon: string): string {
  return `/icons/places/${icon}.svg`;
}
