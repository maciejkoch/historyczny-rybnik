import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readPublicPlace, readPublicSummaries } from '../src/public-places.mjs';
import { publicWeb } from '../src/public-web.mjs';

const [fixture] = JSON.parse(
  readFileSync(new URL('../../data/places.fixture.json', import.meta.url)),
);
function snapshot(record, fields) {
  const { id, ...value } = structuredClone(record);
  const point = value.location.coordinates;
  value.location.coordinates = point ? { latitude: point.lat, longitude: point.lng } : null;
  value.createdAt = { toDate: () => new Date(record.createdAt) };
  value.updatedAt = { toDate: () => new Date(record.updatedAt) };
  return {
    id,
    data: () => (fields ? Object.fromEntries(fields.map((field) => [field, value[field]])) : value),
  };
}
function database(records) {
  return {
    collection(name) {
      assert.equal(name, 'places');
      function query(filters = [], fields, maximum) {
        return {
          where(field, op, value) {
            return query([...filters, [field, op, value]], fields, maximum);
          },
          select(...value) {
            return query(filters, value, maximum);
          },
          limit(value) {
            return query(filters, fields, value);
          },
          async get() {
            assert.ok(maximum <= 1001);
            const matched = records.filter((record) =>
              filters.every(([field, op, value]) =>
                op === 'array-contains' ? record[field].includes(value) : record[field] === value,
              ),
            );
            return { docs: matched.slice(0, maximum).map((record) => snapshot(record, fields)) };
          },
        };
      }
      return query();
    },
  };
}
test('list reads only the public summary of published places', async () => {
  const draft = { ...fixture, id: 'draft', slug: 'draft', published: false };
  const result = await readPublicSummaries(database([fixture, draft]));
  assert.equal(result.length, 1);
  assert.equal(result[0].id, fixture.id);
  assert.deepEqual(result[0].location, fixture.location);
  assert.equal('description' in result[0], false);
  assert.equal('mentions' in result[0], false);
  assert.equal('published' in result[0], false);
});
test('detail resolves current slugs but never unpublished records', async () => {
  const place = fixture;
  const db = database([place, { ...fixture, id: 'draft', slug: 'draft', published: false }]);
  assert.equal((await readPublicPlace(db, place.slug)).id, place.id);
  assert.equal(await readPublicPlace(db, 'old-address'), null);
  assert.equal(await readPublicPlace(db, 'draft'), null);
  assert.equal(await readPublicPlace(db, '../invalid'), null);
  await assert.rejects(
    readPublicPlace(database([{ ...place, privateNote: 'secret' }]), place.slug),
  );
});

async function request(handler, path) {
  const response = {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    type(value) {
      this.headers['Content-Type'] = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
    end() {
      return this;
    },
    redirect(code, location) {
      this.statusCode = code;
      this.headers.Location = location;
      return this;
    },
  };
  await handler({ method: 'GET', originalUrl: path }, response);
  return response;
}
test('public requests reflect database edits, exclude drafts and handle redirects and errors', async () => {
  const records = [{ ...fixture }];
  const handler = publicWeb(
    database(records),
    async (_request, context) => new Response('<h1>' + context.place.description + '</h1>'),
  );
  const first = await request(handler, '/miejsca/' + fixture.slug);
  assert.match(first.body, new RegExp(fixture.description));
  assert.equal(first.headers['Cache-Control'], 'no-store');
  records[0] = { ...records[0], description: 'Nowy opis' };
  assert.match((await request(handler, '/miejsca/' + fixture.slug)).body, /Nowy opis/);
  assert.equal((await request(handler, '/miejsca/old-address')).statusCode, 404);
  assert.equal((await request(handler, '/miejsca/brak')).statusCode, 404);
  records[0] = { ...records[0], published: false };
  assert.equal((await request(handler, '/miejsca/' + fixture.slug)).statusCode, 404);
  assert.deepEqual((await request(handler, '/api/public-places')).body, []);
  const sitemap = (await request(handler, '/sitemap.xml')).body;
  for (const route of ['/szukaj', '/o-nas', '/prywatnosc']) assert.ok(sitemap.includes(route));
  assert.equal(
    (
      await request(
        publicWeb(
          {
            collection() {
              throw Error('private diagnostic');
            },
          },
          null,
        ),
        '/api/public-places',
      )
    ).statusCode,
    503,
  );
});

test('gallery is included in API responses and SSR', async () => {
  const db = database([fixture]);
  let rendered;
  const render = async (_request, context) => {
    rendered = context.place;
    return new Response('ok');
  };
  const handler = publicWeb(db, render);
  assert.equal(
    (await request(handler, '/api/public-places/' + fixture.slug)).body.materials.length,
    1,
  );
  await request(handler, '/miejsca/' + fixture.slug);
  assert.equal(rendered.materials.length, 1);
});

test('indexing and sitemap origin are limited to the explicit production configuration', async () => {
  const db = database([fixture]);
  const preview = await request(publicWeb(db, null), '/sitemap.xml');
  assert.equal(preview.headers['X-Robots-Tag'], 'noindex, nofollow');
  assert.match(preview.body, /https:\/\/historyczny-rybnik-dev\.web\.app/);
  const production = await request(
    publicWeb(db, null, { origin: 'https://historyczny.rybnik.pl', indexable: true }),
    '/sitemap.xml',
  );
  assert.equal(production.headers['X-Robots-Tag'], undefined);
  assert.match(production.body, /https:\/\/historyczny\.rybnik\.pl/);
  assert.doesNotMatch(production.body, /historyczny-rybnik-dev/);
  assert.throws(() => publicWeb(db, null, { indexable: true }));
  assert.throws(() => publicWeb(db, null, { origin: 'https://example.com' }));
});

test('public failure logs no underlying diagnostics', async () => {
  const original = console.error;
  const logs = [];
  try {
    console.error = (...values) => logs.push(values.join(' '));
    const handler = publicWeb(
      {
        collection() {
          throw new Error('sensitive diagnostic');
        },
      },
      null,
    );
    const result = await request(handler, '/api/public-places');
    assert.equal(result.statusCode, 503);
    assert.equal(logs.length, 1);
    assert.doesNotMatch(logs[0], /sensitive diagnostic/);
    assert.doesNotMatch(result.body, /sensitive diagnostic/);
  } finally {
    console.error = original;
  }
});
