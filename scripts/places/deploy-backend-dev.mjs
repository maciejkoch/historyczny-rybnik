import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw new Error(`${command} failed`);
};
const arg = process.argv.find((value) => value.startsWith('--preserve-renderer='));
if (!arg) {
  run('npm', ['run', 'build']);
  run('npx', [
    'firebase',
    'deploy',
    '--config',
    'firebase.backend.dev.json',
    '--project',
    'historyczny-rybnik',
    '--only',
    'functions:places-dev:placesDevRead,functions:places-dev:placesDevUpdate,functions:places-dev:placesDevWeb,firestore:places-dev,storage:places-dev,auth',
  ]);
} else {
  const root = resolve(arg.slice('--preserve-renderer='.length));
  const browser = resolve(root, 'dist/historyczny-rybnik/browser/index.html');
  const server = resolve(root, 'functions/ssr/server.mjs');
  if (!existsSync(browser) || !existsSync(server)) throw new Error('Renderer build is missing');
  const local = readFileSync(browser, 'utf8');
  const response = await fetch(
    'https://historyczny-rybnik-dev.web.app/miejsca/bazylika-sw-antoniego-padewskiego',
  );
  if (!response.ok) throw new Error('Cannot verify the currently deployed renderer');
  const live = await response.text();
  const assets = (html) =>
    [...html.matchAll(/(?:src|href)="([^"/]+\.(?:js|css))"/g)].map((m) => m[1]).sort();
  if (JSON.stringify(assets(local)) !== JSON.stringify(assets(live)) || !assets(local).length)
    throw new Error('Preserved renderer assets do not match the currently deployed SSR');
  run('npm', ['run', 'build']);
  const backup = resolve('.local/new-ssr-before-api-deploy');
  rmSync(backup, { recursive: true, force: true });
  cpSync('functions/ssr', backup, { recursive: true });
  try {
    rmSync('functions/ssr', { recursive: true, force: true });
    cpSync(resolve(root, 'functions/ssr'), 'functions/ssr', { recursive: true });
    run('npx', [
      'firebase',
      'deploy',
      '--config',
      'firebase.backend.dev.json',
      '--project',
      'historyczny-rybnik',
      '--only',
      'functions:places-dev:placesDevWeb',
      '--non-interactive',
    ]);
  } finally {
    rmSync('functions/ssr', { recursive: true, force: true });
    cpSync(backup, 'functions/ssr', { recursive: true });
    rmSync(backup, { recursive: true, force: true });
  }
}
