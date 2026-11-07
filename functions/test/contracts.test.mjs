import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  placeSchema,
  publicPlaceSchema,
  publicCatalogSchema,
  catalogSchema,
  locationDtoSchema,
  parseReadResponse,
  writeRequestSchema,
} from '../src/contracts/places.mjs';
import { readLocations, updateLocation } from '../src/service.mjs';

const places = JSON.parse(
  readFileSync(new URL('../../data/places.test-data.json', import.meta.url)),
);
const { published, createdAt, ...publicPlace } = places[0];
const dto = {
  id: places[0].id,
  location: places[0].location,
  locationVersion: 0,
  updatedAt: places[0].updatedAt,
};

test('public and stored records have distinct strict contracts', () => {
  assert.deepEqual(publicCatalogSchema.parse([publicPlace]), [publicPlace]);
  assert.equal(publicPlaceSchema.safeParse(places[0]).success, false);
  assert.equal(placeSchema.safeParse(publicPlace).success, false);
  for (const change of [
    { category: 'unknown' },
    { locationVersion: Number.MAX_SAFE_INTEGER + 1 },
    { location: { coordinates: null, precision: 'building', explanation: null } },
    { location: { ...dto.location, explanation: '  ' } },
  ])
    assert.equal(placeSchema.safeParse({ ...places[0], ...change }).success, false);
});

test('catalogue preserves byte limits, uniqueness and ownership of images', () => {
  const oversized = structuredClone(places[0]);
  oversized.references = Array.from({ length: 100 }, (_, i) => ({
    ...oversized.references[0],
    id: `ref_${i}`,
    excerpt: 'ą'.repeat(10000),
    images: [],
  }));
  assert.equal(placeSchema.safeParse(oversized).success, false);
  assert.equal(catalogSchema.safeParse([...places, places[0]]).success, false);
  for (const key of ['storagePath', 'thumbnailPath']) {
    const place = structuredClone(places[0]);
    const image = place.references.find((r) => r.images.length).images[0];
    image[key] = image[key].replace(`/places/${place.id}/`, '/places/another/');
    assert.equal(placeSchema.safeParse(place).success, false);
  }
});

test('client accepts partial results but rejects the entire malformed response', () => {
  assert.deepEqual(parseReadResponse({ places: [] }, [dto.id]), { places: [] });
  assert.deepEqual(parseReadResponse({ places: [dto] }, [dto.id]), { places: [dto] });
  for (const value of [
    null,
    {},
    { places: [dto], private: true },
    { places: [dto, dto] },
    { places: [{ ...dto, id: 'unrequested' }] },
    { places: [{ ...dto, privateNote: 'secret' }] },
    { places: [{ ...dto, updatedAt: '2026-02-30T00:00:00Z' }] },
    { places: [{ ...dto, locationVersion: -1 }] },
    { places: [{ ...dto, location: { ...dto.location, coordinates: { lat: '50', lng: 18 } } }] },
    {
      places: [{ ...dto, location: { ...dto.location, coordinates: { lat: NaN, lng: Infinity } } }],
    },
  ])
    assert.throws(() => parseReadResponse(value, [dto.id]));
});

test('known/unknown location and optimistic version bounds do not coerce input', () => {
  const request = {
    placeId: dto.id,
    expectedLocationVersion: Number.MAX_SAFE_INTEGER - 1,
    location: dto.location,
  };
  assert.equal(writeRequestSchema.safeParse(request).success, true);
  for (const expectedLocationVersion of ['', '0', -1, 0.1, Number.MAX_SAFE_INTEGER])
    assert.equal(
      writeRequestSchema.safeParse({ ...request, expectedLocationVersion }).success,
      false,
    );
  assert.equal(
    locationDtoSchema.safeParse({ ...dto, locationVersion: Number.MAX_SAFE_INTEGER }).success,
    true,
  );
  const unknown = { coordinates: null, precision: 'unknown', explanation: null };
  assert.equal(locationDtoSchema.safeParse({ ...dto, location: unknown }).success, true);
  assert.equal(writeRequestSchema.safeParse({ ...request, location: unknown }).success, false);
});

test('invalid callable requests fail before database access and expose only field codes', async () => {
  const request = {
    app: {},
    auth: { token: { admin: true, firebase: { sign_in_provider: 'google.com' } } },
    data: { ids: [], private: 'secret' },
  };
  await assert.rejects(readLocations({}, request), (error) => {
    assert.equal(error.code, 'invalid-argument');
    assert.ok(error.details.issues.length);
    assert.ok(
      error.details.issues.every((issue) => Object.keys(issue).sort().join() === 'code,path'),
    );
    assert.equal(JSON.stringify(error.details).includes('secret'), false);
    return true;
  });
  await assert.rejects(
    updateLocation(
      {},
      {
        ...request,
        data: { placeId: dto.id, expectedLocationVersion: '', location: dto.location },
      },
    ),
    { code: 'invalid-argument' },
  );
});

test('malformed persisted location returns a sanitized server error', async () => {
  const doc = {
    exists: true,
    id: dto.id,
    data: () => ({
      published: true,
      location: { ...dto.location, precision: 'broken' },
      locationVersion: 0,
      updatedAt: { toDate: () => new Date(dto.updatedAt) },
    }),
  };
  await assert.rejects(
    readLocations(
      { collection: () => ({ doc: () => ({}) }), getAll: async () => [doc] },
      { app: {}, data: { ids: [dto.id] } },
    ),
    (error) => {
      assert.equal(error.code, 'internal');
      assert.equal(error.message, 'Invalid location data');
      assert.equal(error.details, undefined);
      return true;
    },
  );
});
