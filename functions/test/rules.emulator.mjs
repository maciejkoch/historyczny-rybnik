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
import { ref, uploadBytes, getBytes } from 'firebase/storage';
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
await test('public reviewed asset readable; private assets and writes denied', async () => {
  await env.withSecurityRulesDisabled(async (c) => {
    await uploadBytes(ref(c.storage(), 'public/places/a/b/test.webp'), new Uint8Array([1, 2]));
    await uploadBytes(ref(c.storage(), 'private/test.webp'), new Uint8Array([1, 2]));
  });
  const storage = env.unauthenticatedContext().storage();
  await assertSucceeds(getBytes(ref(storage, 'public/places/a/b/test.webp')));
  await assertFails(getBytes(ref(storage, 'private/test.webp')));
  await assertFails(uploadBytes(ref(storage, 'public/places/a/b/new.webp'), new Uint8Array([1])));
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
