import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
import * as angular from '@angular/core';

// Exercise the actual service with Angular signals and browser storage/navigation doubles.
// No DOM or live Google requests are needed for these permission boundary tests.
const compiled = ts.transpileModule(readFileSync('src/app/privacy/consent.ts', 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    experimentalDecorators: true,
  },
}).outputText;
const key = 'historyczny-rybnik.consent.v1';
const panel = 'historyczny-rybnik.panel.v1';
const decision = (preferences, google, savedAt = Date.now()) =>
  JSON.stringify({ version: 1, preferences, google, savedAt });
function setup({
  saved,
  blocked = false,
  browser = true,
  url = 'https://example.test/szukaj?q=rybnik',
} = {}) {
  const storage = new Map([[panel, '{"width":600}']]);
  if (saved !== undefined) storage.set(key, saved);
  const navigation = [];
  const callbacks = [];
  const listeners = new Map();
  const window = {
    localStorage: {
      getItem: (k) => {
        if (blocked) throw Error('blocked');
        return storage.get(k) ?? null;
      },
      setItem: (k, v) => {
        if (blocked) throw Error('blocked');
        storage.set(k, v);
      },
      removeItem: (k) => {
        if (blocked) throw Error('blocked');
        storage.delete(k);
      },
    },
    location: {
      href: url,
      replace: (value) => navigation.push(value),
      reload: () => navigation.push('reload'),
    },
    history: {
      state: { navigationId: 1 },
      replaceState: (state, _, value) => {
        window.history.state = state;
        window.location.href = String(value);
      },
    },
    addEventListener: (type, handler) => listeners.set(type, handler),
    removeEventListener: (type) => listeners.delete(type),
  };
  const documentToken = Symbol();
  const core = {
    ...angular,
    Injectable: () => (value) => value,
    inject: (token) => {
      if (token === angular.PLATFORM_ID) return browser ? 'browser' : 'server';
      if (token === documentToken) return { defaultView: window };
      if (token === angular.DestroyRef) return { onDestroy() {} };
      throw Error('Unexpected injection');
    },
    afterNextRender: (callback) => callbacks.push(callback),
  };
  const context = {
    exports: {},
    URL,
    Date,
    require: (name) =>
      name === '@angular/core'
        ? core
        : { DOCUMENT: documentToken, isPlatformBrowser: (value) => value === 'browser' },
  };
  vm.runInNewContext(compiled, context);
  const consent = new context.exports.Consent();
  callbacks.forEach((callback) => callback());
  return { consent, storage, navigation, window, listeners };
}

test('first visit denies optional mechanisms and clears legacy preferences', () => {
  const { consent, storage } = setup();
  assert.equal(consent.decided(), false);
  assert.equal(consent.google(), false);
  assert.equal(consent.readPreference(panel), null);
  consent.writePreference(panel, 'new');
  assert.equal(storage.has(panel), false);
});

test('acceptance, independent categories, persistence and withdrawal', () => {
  const { consent, storage, navigation } = setup();
  consent.save(true, false);
  assert.equal(consent.preferences(), true);
  assert.equal(consent.google(), false);
  consent.writePreference(panel, 'new');
  assert.equal(consent.readPreference(panel), 'new');
  consent.writePreference('unrelated', 'forbidden');
  assert.equal(storage.has('unrelated'), false);
  assert.equal(setup({ saved: storage.get(key) }).consent.preferences(), true);
  consent.save(true, true);
  consent.save(false, false);
  assert.equal(consent.google(), false);
  assert.equal(storage.has(panel), false);
  assert.match(navigation[0], /privacy=google-off/);
  const revisit = setup({ saved: storage.get(key) }).consent;
  assert.equal(revisit.decided(), true);
  assert.equal(revisit.preferences(), false);
  assert.equal(revisit.google(), false);
});

test('corrupt, expired, future and wrong-version decisions fail closed', () => {
  for (const saved of [
    '{',
    '{}',
    decision(true, true, 0),
    decision(true, true, Date.now() + 60000),
    '{"version":2,"preferences":true,"google":true}',
    '{"version":1,"preferences":"yes","google":true}',
  ]) {
    const { consent } = setup({ saved });
    assert.equal(consent.decided(), false);
    assert.equal(consent.google(), false);
  }
});

test('storage blocking retains session choice; withdrawal URL overrides stale saved consent', () => {
  const { consent, navigation } = setup({ saved: decision(true, true) });
  consent.save(false, false);
  const next = setup({ saved: decision(true, true), url: navigation[0] });
  assert.equal(next.consent.google(), false);
  assert.equal(new URL(next.window.location.href).searchParams.get('q'), 'rybnik');
  assert.equal(new URL(next.window.location.href).searchParams.has('privacy'), false);
  const blocked = setup({ blocked: true });
  blocked.consent.save(true, false);
  assert.equal(blocked.consent.preferences(), true);
  assert.equal(blocked.consent.storageFailed(), true);
});

test('other tabs reload on consent change; SSR does not access browser storage', () => {
  const { listeners, navigation } = setup();
  listeners.get('storage')({ key });
  assert.equal(navigation[0], 'reload');
  assert.equal(setup({ browser: false, saved: decision(true, true) }).consent.decided(), false);
});
