import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  placeSchema,
  publicPlaceSchema,
  publicCatalogSchema,
  catalogSchema,
  parseReadResponse,
} from '../src/contracts/places.mjs';
import { readLocations } from '../src/service.mjs';

const places = JSON.parse(readFileSync(new URL('../../data/places.fixture.json', import.meta.url)));
const { published, createdAt, ...publicPlace } = places[0];
const dto = {
  id: places[0].id,
  location: places[0].location,
  updatedAt: places[0].updatedAt,
};

test('public and stored records have distinct strict contracts', () => {
  assert.deepEqual(publicCatalogSchema.parse([publicPlace]), [publicPlace]);
  assert.equal(publicPlaceSchema.safeParse(places[0]).success, false);
  assert.equal(placeSchema.safeParse(publicPlace).success, false);
  for (const change of [
    { category: 'unknown' },
    { locationVersion: 1 },
    { location: { coordinates: null, precision: 'exact', explanation: null } },
    { location: { ...dto.location, explanation: 'x'.repeat(2001) } },
  ])
    assert.equal(placeSchema.safeParse({ ...places[0], ...change }).success, false);
});

test('gallery and mention references validate', () => {
  const p = structuredClone(places[0]);
  assert.equal(placeSchema.safeParse(p).success, true);
  const changes = [
    (x) => {
      x.materials[0].width = 0;
    },
    (x) => {
      x.materials[0].storagePath = 'public/materials/other/x.webp';
    },
    (x) => {
      x.materials.push({ ...x.materials[0] });
    },
    (x) => {
      x.mentions[0].materialIds = ['missing'];
    },
    (x) => {
      x.materials = [];
    },
  ];
  for (const change of changes) {
    const v = structuredClone(p);
    change(v);
    assert.equal(placeSchema.safeParse(v).success, false);
  }
  assert.equal(catalogSchema.safeParse([p, p]).success, false);
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

});

test('malformed persisted location returns a sanitized server error', async () => {
  const doc = {
    exists: true,
    id: dto.id,
    data: () => ({
      published: true,
      location: { ...dto.location, precision: 'broken' },
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
