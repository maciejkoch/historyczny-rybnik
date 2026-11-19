import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

// This prepares local artifacts only; production publishing remains blocked.
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

const backend = JSON.parse(readFileSync('firebase.backend.prod.json', 'utf8'));
const functions = [
  {
    source: resolve(output),
    codebase: 'places-prod',
    runtime: 'nodejs22',
    ignore: ['node_modules', 'test', '*.log'],
  },
];
backend.functions = functions;
const hosting = JSON.parse(readFileSync('firebase.dev.json', 'utf8')).hosting;
hosting.site = 'historyczny-rybnik';
hosting.public = resolve('dist/historyczny-rybnik/browser');
hosting.headers = hosting.headers.map((entry) => ({
  ...entry,
  headers: entry.headers.filter((header) => header.key !== 'X-Robots-Tag'),
}));
for (const rewrite of hosting.rewrites) {
  if (rewrite.function?.functionId !== 'placesDevWeb') throw new Error('Unexpected dev rewrite');
  rewrite.function.functionId = 'placesProdWeb';
  rewrite.function.pinTag = true;
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
