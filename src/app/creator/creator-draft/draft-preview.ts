import type { PlaceCard } from '../../atlas/place-details-panel';
import type { CreatorDraft } from '../creator';

// Drafts can be incomplete; adapt them for the shared card without changing the saved data.
export function draftPreview(data: CreatorDraft['data']): PlaceCard {
  const period = (value: typeof data.documentedPeriod) =>
    value?.from ? { from: value.from, to: value.to || null } : null;
  const coordinates = data.location?.coordinates;
  const precision = data.location?.precision;
  const knownLocation =
    coordinates?.lat != null &&
    coordinates.lng != null &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180 &&
    (precision === 'exact' || precision === 'approximate');
  const materials: PlaceCard['materials'] = (data.materials ?? [])
    .filter(
      (m) => m.storagePath && m.thumbnailPath && m.width && m.width > 0 && m.height && m.height > 0,
    )
    .map((m, index) => ({
      materialId: m.materialId || `material-${index}`,
      storagePath: m.storagePath!,
      thumbnailPath: m.thumbnailPath!,
      width: m.width!,
      height: m.height!,
      alt: m.alt || 'Materiał bez opisu',
      source: m.source || null,
      sourceUrl: m.sourceUrl || null,
      date: m.date || null,
      sha256: m.sha256 || '',
      thumbnailSha256: m.thumbnailSha256 || '',
      isPrimary: m.isPrimary ?? false,
    }));
  return {
    name: data.name || 'Miejsce bez nazwy',
    description: data.description || '',
    tags: (data.tags ?? []).map((tag, index) => ({
      id: tag.id || `tag-${index}`,
      name: tag.name || 'Tag bez nazwy',
    })),
    historicalAddress: data.historicalAddress || null,
    documentedPeriod: period(data.documentedPeriod),
    location: knownLocation
      ? {
          coordinates: { lat: coordinates!.lat!, lng: coordinates!.lng! },
          precision,
          explanation: data.location?.explanation || null,
        }
      : { coordinates: null, precision: null, explanation: data.location?.explanation || null },
    materials,
    mentions: (data.mentions ?? []).map((mention, index) => ({
      id: mention.id || `mention-${index}`,
      title: mention.title || 'Wzmianka bez tytułu',
      description: mention.description || '',
      publicationDate: mention.publicationDate || null,
      documentedDate: period(mention.documentedDate),
      source: mention.source || null,
      sourceUrl: mention.sourceUrl || null,
      sourceNote: mention.sourceNote || null,
      materialIds: mention.materialIds ?? [],
    })),
  };
}
