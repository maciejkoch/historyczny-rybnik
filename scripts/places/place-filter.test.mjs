import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const normalize = readFileSync('src/app/places/place.ts', 'utf8').split('export const normalizeSearch')[1];
const filter = readFileSync('src/app/places/place-filter.ts', 'utf8').replace(/^import .*;\n/gm, '');
const source = `const normalizeSearch${normalize}\n${filter}\nreturn filterPlaces;`.replace('export function', 'function');
const js = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None });
const filterPlaces = new Function(js)();
const places = [
  { name: 'Łódź handlowa', tags: [{ id: 'handel' }, { id: 'inne' }], location: { coordinates: null } },
  { name: 'Kościół', tags: [{ id: 'sakralny' }], location: { coordinates: { lat: 50, lng: 18 } } },
  { name: 'Handel', tags: [{ id: 'uslugi' }], location: { coordinates: null } },
];
test('filtruje fragment wyłącznie nazwy z normalizacją', () => {
  assert.deepEqual(filterPlaces(places, 'LODZ', '', false), [places[0]]);
  assert.deepEqual(filterPlaces(places, 'sakralny', '', false), []);
});
test('łączy główny tag, nazwę i brak lokalizacji; pusty filtr resetuje wyniki', () => {
  assert.deepEqual(filterPlaces(places, '', 'handel', false), [places[0]]);
  assert.deepEqual(filterPlaces(places, 'hand', 'handel', true), [places[0]]);
  assert.deepEqual(filterPlaces(places, '', 'sakralny', true), []);
  assert.deepEqual(filterPlaces(places, '', 'inne', false), []);
  assert.deepEqual(filterPlaces(places, '', '', true), [places[0], places[2]]);
  assert.deepEqual(filterPlaces(places, '', '', false), places);
});
