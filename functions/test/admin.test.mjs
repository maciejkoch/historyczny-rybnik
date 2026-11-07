import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateLocation } from '../src/service.mjs';
test('only boolean admin claim permits entry to write validation', async () => {
  for (const admin of [undefined, false, 'true', 1]) {
    await assert.rejects(
      updateLocation(
        {},
        {
          app: {},
          auth: { token: { admin, firebase: { sign_in_provider: 'google.com' } } },
          data: { admin: true },
        },
      ),
      { code: 'permission-denied' },
    );
  }
  await assert.rejects(
    updateLocation(
      {},
      {
        app: {},
        auth: { token: { admin: true, firebase: { sign_in_provider: 'google.com' } } },
        data: {},
      },
    ),
    { code: 'invalid-argument' },
  );
});
