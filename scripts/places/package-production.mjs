import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

// This prepares local artifacts only; publication is a separate command.
execFileSync(process.execPath, ['scripts/verify-production-build.mjs'], { stdio: 'inherit' });
const output = '.local/functions-prod';
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync('functions/src', `${output}/src`, { recursive: true });
cpSync('dist/historyczny-rybnik/server', `${output}/ssr`, { recursive: true });
cpSync('functions/package-lock.json', `${output}/package-lock.json`);
const manifest = JSON.parse(readFileSync('functions/package.json', 'utf8'));
manifest.main = 'src/index.prod.mjs';
writeFileSync(`${output}/package.json`, JSON.stringify(manifest, null, 2) + '\n');

const rootTargets = readFileSync('.firebaserc', 'utf8');
const localTargets = '.local/.firebaserc';
if (existsSync(localTargets) && readFileSync(localTargets, 'utf8') !== rootTargets) {
  throw new Error('Local Firebase targets differ from the reviewed project configuration');
}
if (!existsSync(localTargets)) writeFileSync(localTargets, rootTargets, { flag: 'wx' });

const backend = JSON.parse(readFileSync('firebase.backend.prod.json', 'utf8'));
for (const database of backend.firestore) {
  database.rules = resolve(database.rules);
  database.indexes = resolve(database.indexes);
}
for (const bucket of backend.storage) bucket.rules = resolve(bucket.rules);
const functions = [
  {
    source: 'functions-prod',
    codebase: 'places-prod',
    runtime: 'nodejs22',
    ignore: ['node_modules', 'test', '*.log'],
  },
];
backend.functions = functions;
const hosting = JSON.parse(readFileSync('firebase.json', 'utf8')).hosting;
if (hosting.site !== 'historyczny-rybnik') throw new Error('Unexpected production hosting site');
hosting.public = resolve('dist/historyczny-rybnik/browser');
if (
  hosting.headers.some((entry) => entry.headers.some((header) => header.key === 'X-Robots-Tag'))
) {
  throw new Error('Unexpected production robots header');
}
for (const rewrite of hosting.rewrites) {
  if (
    rewrite.function?.functionId !== 'placesProdWeb' ||
    (rewrite.source === '/miejsca/**') !== (rewrite.function.pinTag === true)
  )
    throw new Error('Unexpected production rewrite');
}
const web = { functions, hosting };
for (const [path, config] of [
  ['.local/firebase.backend.prod.json', backend],
  ['.local/firebase.hosting.prod.json', web],
]) {
  const content = JSON.stringify(config, null, 2) + '\n';
  if (/places-dev|historyczny-rybnik-dev|placesDev/.test(content))
    throw new Error(`Dev target in ${path}`);
  writeFileSync(path, content);
}
console.log('Prepared local production artifacts; nothing was deployed.');
