// Test token arguments are read from environment only. Never log their values.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const appCheck = process.env['APP_CHECK_TOKEN'],
  idToken = process.env['FIREBASE_ID_TOKEN'];
if (!appCheck || !idToken)
  throw new Error(
    'Provide APP_CHECK_TOKEN and Google FIREBASE_ID_TOKEN from a local authenticated test session',
  );
const location = JSON.parse(readFileSync('data/places.seed.json', 'utf8'))[0].location;
const invoke = async (name, data, headers = {}) => {
  const response = await fetch(
    `https://europe-central2-historyczny-rybnik.cloudfunctions.net/${name}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ data }),
    },
  );
  return { status: response.status, body: await response.json() };
};
const read = { ids: ['place_sw_antoni'] };
assert.equal((await invoke('placesDevRead', read)).status, 401);
assert.equal(
  (await invoke('placesDevRead', read, { 'X-Firebase-AppCheck': 'invalid' })).status,
  401,
);
const appHeaders = { 'X-Firebase-AppCheck': appCheck };
const before = await invoke('placesDevRead', read, appHeaders);
assert.equal(before.status, 200);
assert.equal(before.body.result.places.length, 1);
const data = {
  placeId: 'place_sw_antoni',
  expectedLocationVersion: before.body.result.places[0].locationVersion,
  location,
};
assert.equal((await invoke('placesDevUpdate', data, appHeaders)).status, 401);
const headers = { ...appHeaders, Authorization: `Bearer ${idToken}` };
const saved = await invoke('placesDevUpdate', data, headers);
assert.equal(saved.status, 200);
assert.equal((await invoke('placesDevUpdate', data, headers)).status, 409);
const after = await invoke('placesDevRead', read, appHeaders);
assert.deepEqual(after.body.result.places[0].location, location);
console.log(
  'Live API: App Check enforcement, Google Auth, save, conflict and read passed. Verified coordinates retained.',
);
