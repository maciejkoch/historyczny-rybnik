import { readFileSync } from 'node:fs';
import { generate } from './catalog.mjs';
const path = process.env['PLACES_SNAPSHOT'] || 'data/places.test-data.json';
const places = generate(JSON.parse(readFileSync(path, 'utf8')));
console.log(`Prepared ${places.length} public place from ${path}.`);
