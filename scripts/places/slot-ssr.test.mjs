import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { configureSlotSsr } from './slot-ssr.mjs';

test('only place rendering is redirected to the slot function', () => {
  const source = JSON.parse(readFileSync(new URL('../../firebase.dev.json', import.meta.url)));
  for (const slot of [1, 2, 3]) {
    const config = structuredClone(source);
    assert.equal(configureSlotSsr(config, `dev-${slot}`), `placesDevWeb${slot}`);
    assert.equal(config.hosting.site, `historyczny-rybnik-dev-${slot}`);
    for (const route of config.hosting.rewrites) {
      assert.equal(
        route.function.functionId,
        route.source === '/miejsca/**' ? `placesDevWeb${slot}` : 'placesDevWeb',
      );
      assert.equal(route.function.pinTag, route.source === '/miejsca/**' ? true : undefined);
    }
  }
  assert.throws(() => configureSlotSsr(structuredClone(source), 'dev-4'));
  const bad = structuredClone(source);
  bad.hosting.rewrites = [];
  assert.throws(() => configureSlotSsr(bad, 'dev-1'));
});
