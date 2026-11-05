// Shared by the importer, snapshot builder and callable API. No Firebase dependency.
export class ValidationError extends Error {}
export const check = (condition, message) => {
  if (!condition) throw new ValidationError(message);
};
export function object(value, fields) {
  check(value && typeof value === 'object' && !Array.isArray(value), 'Expected object');
  check(
    Object.keys(value).length === fields.length && fields.every((key) => Object.hasOwn(value, key)),
    'Unexpected or missing fields',
  );
}
export function text(value, max = 500, nullable = false) {
  if (nullable && value === null) return;
  check(
    typeof value === 'string' && value.trim().length > 0 && value.length <= max,
    'Invalid text',
  );
}
export function list(value, max, validate) {
  check(Array.isArray(value) && value.length <= max, 'Invalid list');
  value.forEach(validate);
}
export const id = (value) =>
  check(typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value), 'Invalid ID');
export const slug = (value) =>
  check(
    typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100,
    'Invalid slug',
  );
export function url(value) {
  text(value, 2000);
  const parsed = new URL(value);
  check(parsed.protocol === 'https:' && !parsed.username && !parsed.password, 'HTTPS URL required');
}
export function timestamp(value) {
  check(
    typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
      Number.isFinite(Date.parse(value)),
    'Invalid timestamp',
  );
  check(
    new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z'),
    'Invalid timestamp calendar',
  );
}
function dateBounds(value) {
  check(
    typeof value === 'string' && /^\d{4}(-\d{2})?(-\d{2})?$/.test(value),
    'Invalid partial date',
  );
  const [year, month, day] = value.split('-').map(Number);
  check(year >= 1000 && year <= 2999, 'Invalid year');
  if (month !== undefined) check(month >= 1 && month <= 12, 'Invalid month');
  if (day !== undefined)
    check(day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate(), 'Invalid day');
  return [
    Date.UTC(year, (month ?? 1) - 1, day ?? 1),
    Date.UTC(
      year,
      month ?? 12,
      day ?? (month ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 31),
    ),
  ];
}
export function partialDate(value) {
  if (value === null) return;
  object(value, ['from', 'to', 'approximate']);
  const from = dateBounds(value.from);
  const to = value.to === null ? from : dateBounds(value.to);
  check(from[0] <= to[1] && typeof value.approximate === 'boolean', 'Invalid date range');
}
export function location(value, allowUnknown = true) {
  object(value, ['coordinates', 'precision', 'explanation']);
  text(value.explanation, 2000, allowUnknown);
  if (value.coordinates === null) {
    check(allowUnknown && value.precision === 'unknown', 'Removing a location is disabled');
    return;
  }
  object(value.coordinates, ['lat', 'lng']);
  const { lat, lng } = value.coordinates;
  check(
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180,
    'Invalid coordinates',
  );
  check(['building', 'approximate'].includes(value.precision), 'Invalid precision');
  text(value.explanation, 2000);
}
export function validatePlace(place) {
  object(place, [
    'id',
    'name',
    'slug',
    'previousSlugs',
    'description',
    'category',
    'aliases',
    'addresses',
    'district',
    'location',
    'references',
    'published',
    'locationVersion',
    'createdAt',
    'updatedAt',
  ]);
  id(place.id);
  text(place.name, 200);
  slug(place.slug);
  list(place.previousSlugs, 30, slug);
  text(place.description, 20000);
  check(
    ['industry', 'commerce', 'religion', 'education', 'public', 'culture', 'other'].includes(
      place.category,
    ),
    'Invalid category',
  );
  list(place.aliases, 30, (value) => text(value, 200));
  text(place.district, 200, true);
  list(place.addresses, 30, (address) => {
    object(address, ['type', 'text']);
    check(['historical', 'current'].includes(address.type), 'Invalid address');
    text(address.text, 500);
  });
  location(place.location);
  check(typeof place.published === 'boolean', 'Invalid publication status');
  check(
    Number.isSafeInteger(place.locationVersion) && place.locationVersion >= 0,
    'Invalid version',
  );
  timestamp(place.createdAt);
  timestamp(place.updatedAt);
  const refs = new Set();
  list(place.references, 100, (ref) => {
    object(ref, [
      'id',
      'title',
      'url',
      'page',
      'publicationDate',
      'historicalDate',
      'accessedAt',
      'excerpt',
      'excerptType',
      'note',
      'images',
    ]);
    id(ref.id);
    check(!refs.has(ref.id), 'Duplicate reference');
    refs.add(ref.id);
    text(ref.title, 500);
    if (ref.url !== null) url(ref.url);
    text(ref.page, 100, true);
    partialDate(ref.publicationDate);
    partialDate(ref.historicalDate);
    timestamp(ref.accessedAt);
    text(ref.excerpt, 10000);
    check(['quote', 'transcription', 'summary'].includes(ref.excerptType), 'Invalid excerpt type');
    text(ref.note, 2000, true);
    list(ref.images, 10, (image) => {
      object(image, ['storagePath', 'thumbnailPath', 'alt', 'credit', 'rights']);
      for (const key of ['storagePath', 'thumbnailPath']) {
        text(image[key], 500);
        check(
          new RegExp(`^public/places/${place.id}/${ref.id}/[a-zA-Z0-9_-]+\\.(webp|png|jpg)$`).test(
            image[key],
          ),
          'Invalid public asset path',
        );
      }
      text(image.alt, 500);
      text(image.credit, 500);
      text(image.rights, 2000);
    });
  });
  // Conservative headroom for Firestore encoding, field names and document path.
  check(Buffer.byteLength(JSON.stringify(place)) <= 700000, 'Document too large');
  return place;
}
export function validateCatalog(places) {
  check(Array.isArray(places) && places.length <= 1000, 'Invalid catalogue');
  const ids = new Set(),
    slugs = new Set();
  for (const place of places) {
    validatePlace(place);
    check(!ids.has(place.id), 'Duplicate place');
    ids.add(place.id);
    for (const value of [place.slug, ...place.previousSlugs]) {
      check(!slugs.has(value), 'Slug collision');
      slugs.add(value);
    }
  }
  return places;
}
export function readRequest(data) {
  object(data, ['ids']);
  list(data.ids, 100, id);
  check(data.ids.length > 0 && new Set(data.ids).size === data.ids.length, 'Invalid catalogue IDs');
  return data.ids;
}
export function writeRequest(data) {
  object(data, ['placeId', 'expectedLocationVersion', 'location']);
  id(data.placeId);
  check(
    Number.isSafeInteger(data.expectedLocationVersion) &&
      data.expectedLocationVersion >= 0 &&
      data.expectedLocationVersion < Number.MAX_SAFE_INTEGER,
    'Invalid version',
  );
  location(data.location, false);
  return data;
}
