import { readFileSync } from 'node:fs';
import { generate } from './catalog.mjs';
const path = process.env['PLACES_SNAPSHOT'] || 'data/places.seed.json';
const places = generate(JSON.parse(readFileSync(path, 'utf8')));
if (places.length !== 1 || places[0].id !== 'place_sw_antoni')
  throw new Error('Phases 3–5 require exactly the reviewed church');
console.log(`Prepared ${places.length} public place from ${path}.`);
