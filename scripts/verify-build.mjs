import { copyFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import assert from 'node:assert/strict';
const root = 'dist/historyczny-rybnik/browser';
copyFileSync(`${root}/404/index.html`, `${root}/404.html`);
const home = readFileSync(`${root}/index.html`, 'utf8');
assert.match(home, /Miasto zapisane/);
assert.doesNotMatch(home, /Dane przykładowe/);
const catalogue = JSON.parse(readFileSync('data/places.seed.json', 'utf8'));
for (const place of catalogue) {
  const html = readFileSync(`${root}/miejsca/${place.slug}/index.html`, 'utf8');
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
