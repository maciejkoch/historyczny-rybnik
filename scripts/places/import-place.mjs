import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { basename, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { z } from 'zod';
import { placeSchema, timestampSchema, idSchema } from '../../functions/src/contracts/places.mjs';

export const bundleSchema = z.strictObject({
  schemaVersion: z.literal(1),
  expectedUpdatedAt: timestampSchema.nullable(),
  assetsDirectory: z.string().min(1),
  place: placeSchema,
});
export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );

export function fromDocument(doc) {
  if (!doc.exists) return null;
  const p = doc.data(),
    c = p.location.coordinates;
  return placeSchema.parse({
    ...p,
    id: doc.id,
    location: { ...p.location, coordinates: c ? { lat: c.latitude, lng: c.longitude } : null },
    createdAt: p.createdAt.toDate().toISOString(),
    updatedAt: p.updatedAt.toDate().toISOString(),
  });
}

export function planImport(bundle, current, others = []) {
  const p = bundle.place;
  if (!p.published) throw new Error('Reviewed place must be published on dev');
  if (others.some((other) => other.id !== p.id && other.slug === p.slug))
    throw new Error('Slug already belongs to another place');
  if (current && current.slug !== p.slug) throw new Error('Preserve the existing slug');
  if (!current && bundle.expectedUpdatedAt !== null) throw new Error('Place no longer exists');
  if (!current && others.length >= 1000) throw new Error('Catalogue exceeds supported size');
  const desired = current ? { ...p, createdAt: current.createdAt } : p;
  const content = ({ createdAt, updatedAt, ...rest }) => rest;
  if (current && canonical(content(current)) === canonical(content(desired)))
    return { unchanged: true, desired: current, materials: [] };
  if (current && bundle.expectedUpdatedAt === null) throw new Error('Place ID already exists');
  if (current && current.updatedAt !== bundle.expectedUpdatedAt)
    throw new Error('Place changed since review; read again and request approval');
  const oldAssets = new Map(
    (current?.materials ?? []).flatMap((m) => [
      [m.storagePath, m.sha256],
      [m.thumbnailPath, m.thumbnailSha256],
    ]),
  );
  const materials = p.materials.filter(
    (m) =>
      oldAssets.get(m.storagePath) !== m.sha256 ||
      oldAssets.get(m.thumbnailPath) !== m.thumbnailSha256,
  );
  for (const m of materials)
    for (const [path, hash] of [
      [m.storagePath, m.sha256],
      [m.thumbnailPath, m.thumbnailSha256],
    ])
      if (oldAssets.has(path) && oldAssets.get(path) !== hash)
        throw new Error('Changed image requires a new immutable storage path');
  return { unchanged: false, desired, materials };
}

// Validate local files before any upload. The uploader uses flat, unique filenames.
export function validateAssets(materials, directory) {
  const names = new Map();
  for (const m of materials)
    for (const [path, hash] of [
      [m.storagePath, m.sha256],
      [m.thumbnailPath, m.thumbnailSha256],
    ]) {
      const name = basename(path);
      if (names.has(name) && names.get(name) !== hash) throw new Error('Ambiguous asset filename');
      names.set(name, hash);
      const file = resolve(directory, name);
      if (statSync(file).size > 3000000) throw new Error('Asset exceeds 3 MB');
      const bytes = readFileSync(file);
      if (!bytes.length || digest(bytes) !== hash) throw new Error('Asset SHA-256 mismatch');
      const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp =
        bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      if (!(
        (path.endsWith('.png') && png) ||
        (path.endsWith('.jpg') && jpg) ||
        (path.endsWith('.webp') && webp)
      ))
        throw new Error('Asset is not an image of the declared type');
    }
}

async function main(args) {
  const allowed =
    /^(--apply|--firebase-cli|--read=[a-zA-Z0-9_-]+|--output=.+|--approved-sha256=[a-f0-9]{64})$/;
  if (args.some((arg) => arg.startsWith('--') && !allowed.test(arg)))
    throw new Error('Unknown option');
  const readId = args.find((a) => a.startsWith('--read='))?.slice(7);
  if (readId) {
    if (args.includes('--apply')) throw new Error('Read cannot apply changes');
    idSchema.parse(readId);
    const output = args.find((a) => a.startsWith('--output='))?.slice(9);
    if (!output) throw new Error('Use --output=.local/place.json');
    const { database } = await import('./firestore.mjs');
    const db = await database('build');
    try {
      const current = fromDocument(await db.collection('places').doc(readId).get());
      if (!current) throw new Error('Place not found');
      mkdirSync(dirname(resolve(output)), { recursive: true });
      writeFileSync(
        output,
        JSON.stringify(
          {
            schemaVersion: 1,
            expectedUpdatedAt: current.updatedAt,
            assetsDirectory: './images',
            place: current,
          },
          null,
          2,
        ) + '\n',
        { flag: 'wx' },
      );
      console.log(`Read place to ${output}`);
    } finally {
      await db.terminate();
    }
    return;
  }
  const input = args.filter((a) => !a.startsWith('--'));
  if (input.length !== 1)
    throw new Error('Use import-place.mjs bundle.json [--apply --approved-sha256=HASH]');
  if (statSync(input[0]).size > 1000000) throw new Error('Bundle exceeds 1 MB');
  const bytes = readFileSync(input[0]),
    hash = digest(bytes);
  const bundle = bundleSchema.parse(JSON.parse(bytes));
  if (!bundle.place.published) throw new Error('Reviewed place must be published on dev');
  const directory = resolve(dirname(resolve(input[0])), bundle.assetsDirectory);
  console.log(
    JSON.stringify(
      {
        target: 'historyczny-rybnik/places-dev',
        bucket: 'historyczny-rybnik-dev-files',
        operation: bundle.expectedUpdatedAt === null ? 'create' : 'update',
        approvedSha256: hash,
        place: bundle.place,
      },
      null,
      2,
    ),
  );
  if (!args.includes('--apply')) {
    // Existing remote files need not be downloaded for an editorial update.
    if (bundle.expectedUpdatedAt === null) validateAssets(bundle.place.materials, directory);
    console.log('Dry run; no cloud access. Updates check changed assets and conflicts on apply.');
    return;
  }
  if (!args.includes(`--approved-sha256=${hash}`))
    throw new Error('Approval hash missing or bundle changed');
  if (
    process.env.GCLOUD_PROJECT !== 'historyczny-rybnik' ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.STORAGE_EMULATOR_HOST
  )
    throw new Error('Apply requires the explicit dev project and no emulator overrides');
  const { database, GeoPoint, Timestamp } = await import('./firestore.mjs');
  const db = await database('import');
  const readPlan = async (tx) => {
    const docs = await tx.get(db.collection('places').limit(1001));
    if (docs.size > 1000) throw new Error('Catalogue exceeds supported size');
    const current = fromDocument(
      docs.docs.find((d) => d.id === bundle.place.id) ?? { exists: false },
    );
    return {
      current,
      ...planImport(
        bundle,
        current,
        docs.docs.map((d) => ({ id: d.id, slug: d.data().slug })),
      ),
    };
  };
  try {
    const plan = await db.runTransaction(readPlan, { readOnly: true });
    if (plan.unchanged) {
      console.log('Already imported; no changes.');
      return;
    }
    validateAssets(plan.materials, directory);
    mkdirSync('.local/place-import-backups', { recursive: true });
    writeFileSync(
      `.local/place-import-backups/${bundle.place.id}-${Date.now()}.json`,
      JSON.stringify(plan.current, null, 2) + '\n',
      { flag: 'wx' },
    );
    if (plan.materials.length) {
      mkdirSync('.local', { recursive: true });
      const temporary = mkdtempSync('.local/place-upload-');
      try {
        const catalog = resolve(temporary, 'catalog.json');
        writeFileSync(
          catalog,
          JSON.stringify([{ ...bundle.place, mentions: [], materials: plan.materials }]),
        );
        const result = spawnSync(
          process.execPath,
          [
            fileURLToPath(new URL('./upload-assets.mjs', import.meta.url)),
            `--directory=${directory}`,
            '--apply',
            ...(args.includes('--firebase-cli') ? ['--firebase-cli'] : []),
          ],
          { env: { ...process.env, PLACES_SNAPSHOT: catalog }, stdio: 'inherit' },
        );
        if (result.error || result.status !== 0)
          throw new Error('Asset upload failed; place was not written');
      } finally {
        rmSync(temporary, { recursive: true, force: true });
      }
    }
    await db.runTransaction(async (tx) => {
      const latest = await readPlan(tx);
      if (latest.unchanged) return;
      const { id, ...p } = latest.desired,
        c = p.location.coordinates;
      tx.set(db.collection('places').doc(id), {
        ...p,
        location: { ...p.location, coordinates: c ? new GeoPoint(c.lat, c.lng) : null },
        createdAt: latest.current
          ? Timestamp.fromDate(new Date(latest.current.createdAt))
          : Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });
    console.log(
      `Imported ${bundle.place.id} to dev. Application verification is left to the owner.`,
    );
  } finally {
    await db.terminate();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main(process.argv.slice(2)).catch((error) => {
    const reason =
      error instanceof z.ZodError
        ? 'Invalid bundle fields: ' + error.issues.map((issue) => issue.path.join('.')).join(', ')
        : error.code
          ? `Operation failed (${error.code}); check files and operator permissions`
          : error.message;
    console.error(`Import failed: ${reason}`);
    process.exitCode = 1;
  });
