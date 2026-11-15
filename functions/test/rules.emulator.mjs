import { initializeApp, deleteApp } from 'firebase/app';
import { test, after } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
const env = await initializeTestEnvironment({
  projectId: 'demo-historyczny-rybnik',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') },
  storage: { rules: readFileSync(new URL('../../storage.rules', import.meta.url), 'utf8') },
});
await test('all direct Firestore access denied even authenticated', async () => {
  for (const context of [
    env.unauthenticatedContext(),
    env.authenticatedContext('alice'),
    env.authenticatedContext('bob', { admin: true }),
  ]) {
    const db = context.firestore();
    await assertFails(getDoc(doc(db, 'places/x')));
    await assertFails(getDocs(collection(db, 'places')));
    await assertFails(
      setDoc(doc(db, 'places/x'), { published: true, ownerId: 'alice', locationVersion: 999 }),
    );
    await assertFails(deleteDoc(doc(db, 'places/x')));
    await assertFails(setDoc(doc(db, 'places/x/history/y'), { author: 'alice' }));
  }
});
await test('public asset readable; only Google administrators can create bounded images', async () => {
  await env.withSecurityRulesDisabled(async (c) => {
    await uploadBytes(
      ref(c.storage(), 'public/materials/material-a/test.webp'),
      new Uint8Array([1, 2]),
    );
    await uploadBytes(ref(c.storage(), 'research-workspace/head.json'), new Uint8Array([1, 2]));
    await uploadBytes(ref(c.storage(), 'private/test.webp'), new Uint8Array([1, 2]));
  });
  const storage = env.unauthenticatedContext().storage();
  await assertFails(getBytes(ref(storage, 'public/places/a/b/test.webp')));
  await assertFails(getBytes(ref(storage, 'private/test.webp')));
  await assertSucceeds(getBytes(ref(storage, 'public/materials/material-a/test.webp')));
  for (const context of [
    env.unauthenticatedContext(),
    env.authenticatedContext('admin', { admin: true }),
  ]) {
    await assertFails(getBytes(ref(context.storage(), 'research-workspace/head.json')));
    await assertFails(
      uploadBytes(ref(context.storage(), 'research-workspace/head.json'), new Uint8Array([3])),
    );
    await assertFails(
      uploadBytes(
        ref(context.storage(), 'public/materials/material-a/new.webp'),
        new Uint8Array([3]),
      ),
    );
  }
  await assertFails(uploadBytes(ref(storage, 'public/places/a/b/new.webp'), new Uint8Array([1])));
  const admin = env
    .authenticatedContext('editor', {
      admin: true,
      firebase: { sign_in_provider: 'google.com' },
    })
    .storage();
  const image = ref(admin, 'public/materials/material-b/image.webp');
  await assertSucceeds(uploadBytes(image, new Uint8Array([1, 2]), { contentType: 'image/webp' }));
  await assertFails(deleteObject(image));
  await assertFails(uploadBytes(image, new Uint8Array([3]), { contentType: 'image/webp' }));
  await assertFails(
    uploadBytes(ref(admin, 'public/materials/material-b/fake.jpg'), new Uint8Array([1]), {
      contentType: 'text/html',
    }),
  );
  await assertFails(
    uploadBytes(
      ref(admin, 'public/materials/material-b/large.png'),
      new Uint8Array(10 * 1024 * 1024 + 1),
      { contentType: 'image/png' },
    ),
  );
  const regular = env
    .authenticatedContext('regular', { firebase: { sign_in_provider: 'google.com' } })
    .storage();
  await assertFails(
    uploadBytes(ref(regular, 'public/materials/material-b/other.webp'), new Uint8Array([1]), {
      contentType: 'image/webp',
    }),
  );
});

await test('named places-dev database also denies every direct client operation', async () => {
  for (const uid of [null, 'alice']) {
    const app = initializeApp({ projectId: 'demo-historyczny-rybnik' }, 'named-rules-' + uid);
    const db = getFirestore(app, 'places-dev');
    const [host, port] = process.env['FIRESTORE_EMULATOR_HOST'].split(':');
    connectFirestoreEmulator(
      db,
      host,
      Number(port),
      uid ? { mockUserToken: { sub: uid } } : undefined,
    );
    await assertFails(getDoc(doc(db, 'places/x')));
    await assertFails(getDocs(collection(db, 'places')));
    await assertFails(setDoc(doc(db, 'places/x'), { published: true }));
    await assertFails(deleteDoc(doc(db, 'places/x')));
    await deleteApp(app);
  }
});

after(() => env.cleanup());
