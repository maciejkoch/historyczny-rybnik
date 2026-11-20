import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'dist/historyczny-rybnik';
const browser = join(root, 'browser');
const read = (path) => readFile(join(browser, path), 'utf8');
const robots = await read('robots.txt');
assert.match(robots, /Sitemap: https:\/\/historyczny\.rybnik\.pl\/sitemap\.xml/);
assert.doesNotMatch(robots, /Disallow:\s*\//i);
for (const path of [
  'index.html',
  'szukaj/index.html',
  'o-nas/index.html',
  'prywatnosc/index.html',
]) {
  const html = await read(path);
  assert.doesNotMatch(html, /noindex/i, path);
  assert.doesNotMatch(html, /historyczny-rybnik-dev\.web\.app/i, path);
}
const files = await readdir(browser);
const javascript = (await Promise.all(files.filter((file) => file.endsWith('.js')).map(read))).join(
  '\n',
);
for (const forbidden of [
  'historyczny-rybnik-dev-files',
  'historyczny-rybnik-dev.web.app',
  'placesDevRead',
  'placesDevUpdate',
]) {
  assert.equal(javascript.includes(forbidden), false, `Unexpected dev configuration: ${forbidden}`);
}
for (const expected of ['historyczny-rybnik-prod-files', 'placesProdRead', 'placesProdUpdate']) {
  assert.ok(javascript.includes(expected), `Missing production configuration: ${expected}`);
}
const about = await read('o-nas/index.html');
assert.match(about, /rel="canonical" href="https:\/\/historyczny\.rybnik\.pl\/o-nas"/);
const privacy = await read('prywatnosc/index.html');
assert.match(privacy, /rel="canonical" href="https:\/\/historyczny\.rybnik\.pl\/prywatnosc"/);
assert.match(privacy, /name="description" content="Informacje o prywatności/);
const home = await read('index.html');
assert.match(home, /rel="canonical" href="https:\/\/historyczny\.rybnik\.pl\//);
console.log('Verified production origin, indexing, robots and isolation of browser configuration.');

const [{ readPublicPlace }, { renderPlace }] = await Promise.all([
  import('../functions/src/public-places.mjs'),
  import('../dist/historyczny-rybnik/server/server.mjs'),
]);
const [fixture] = JSON.parse(await readFile('data/places.fixture.json', 'utf8'));
const data = structuredClone(fixture);
delete data.id;
if (data.location.coordinates) {
  const { lat, lng } = data.location.coordinates;
  data.location.coordinates = { latitude: lat, longitude: lng };
}
data.createdAt = { toDate: () => new Date(fixture.createdAt) };
data.updatedAt = { toDate: () => new Date(fixture.updatedAt) };
const query = {
  where() {
    return query;
  },
  limit() {
    return query;
  },
  async get() {
    return { docs: [{ id: fixture.id, data: () => data }] };
  },
};
const place = await readPublicPlace({ collection: () => query }, fixture.slug);
const response = await renderPlace(
  new Request(`https://historyczny.rybnik.pl/miejsca/${fixture.slug}`),
  { place },
);
assert.equal(response.status, 200);
const html = await response.text();
assert.ok(html.includes(place.name));
assert.ok(html.includes(`https://historyczny.rybnik.pl/miejsca/${fixture.slug}`));
assert.doesNotMatch(html, /noindex|historyczny-rybnik-dev/i);
console.log('Verified production SSR on synthetic data.');
