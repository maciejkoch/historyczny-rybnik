import { copyFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import assert from 'node:assert/strict';
const root = 'dist/historyczny-rybnik/browser';
copyFileSync(`${root}/404/index.html`, `${root}/404.html`);
const home = readFileSync(`${root}/index.html`, 'utf8');
assert.match(home, /Miasto zapisane/);
assert.match(home, /screen-map/);
const search = readFileSync(`${root}/szukaj/index.html`, 'utf8');
assert.match(search, /screen-search/);
assert.match(search, /Znajdź miejsce/);
assert.match(search, /noindex/);
assert.ok(search.includes('https://historyczny-rybnik-dev.web.app/szukaj'));

assert.doesNotMatch(home, /Dane przykładowe/);
const catalogue = JSON.parse(readFileSync('data/places.test-data.json', 'utf8'));
for (const place of catalogue) {
  const html = readFileSync(`${root}/miejsca/${place.slug}/index.html`, 'utf8');
  assert.match(html, /screen-place/);
  assert.ok(html.includes(place.name)); assert.ok(html.includes(place.description));
  assert.match(html, /rel="canonical"/); assert.match(html, /og:title/);
  for (const ref of place.references) assert.ok(html.includes(ref.title));
}
assert.match(readFileSync(`${root}/sitemap.xml`, 'utf8'), /bazylika-sw-antoniego/);
assert.ok(existsSync(`${root}/maplibre/maplibre-gl-worker.mjs`));
assert.ok(existsSync(`${root}/maps/rybnik-style.json`));
assert.match(home, /noindex/);
assert.match(home, /lang="pl"/);
assert.match(readFileSync(`${root}/404.html`, 'utf8'), /Nie ma takiej strony/);
assert.ok(existsSync(`${root}/brand/ryba-na-mapie.svg`));
const hosting = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting;
assert.ok(!hosting.rewrites?.length, 'Static hosting must preserve real HTTP 404');
console.log('Verified prerendered home, custom 404, brand and preview indexing policy.');

const style = JSON.parse(readFileSync(`${root}/maps/rybnik-style.json`, 'utf8'));
assert.deepEqual(validateStyleMin(style), [], 'MapLibre style must be valid');
const manifest = JSON.parse(readFileSync(`${root}/maps/rybnik-1932/manifest.json`, 'utf8'));
assert.equal(manifest.maxzoom, 18, 'Historical pyramid must support zoom 18');
assert.deepEqual(
  [...new Set(Object.keys(manifest.tiles).map(path => Number(path.split('/')[0])))].sort((a, b) => a - b),
  Array.from({ length: 9 }, (_, index) => index + 10),
  'Historical pyramid must contain every zoom from 10 to 18',
);
assert.deepEqual(
  readdirSync(`${root}/maps/rybnik-1932`, { recursive: true }).filter(path => path.endsWith('.webp')).sort(),
  Object.keys(manifest.tiles).sort(),
  'Published tiles must exactly match the manifest (no stale tiles)',
);
assert.ok(manifest.validation.p90Meters <= 4 && manifest.validation.maxMeters <= 8, 'Historical reference validation failed');
for (const [path, digest] of Object.entries(manifest.tiles)) {
  assert.equal(createHash('sha256').update(readFileSync(`${root}/maps/rybnik-1932/${path}`)).digest('hex'), digest, path);
}
console.log(`Verified vector style and ${Object.keys(manifest.tiles).length} historical tiles.`);

const privacy = readFileSync(`${root}/prywatnosc/index.html`, 'utf8');
assert.match(privacy, /Polityka prywatności i pliki cookie/);
assert.match(privacy, /180 dni/);
assert.match(privacy, /noindex/);
assert.doesNotMatch(home, /<script[^>]+src=[\"'][^\"']*(google|recaptcha)/);
console.log('Verified static privacy page and no embedded Google scripts.');
