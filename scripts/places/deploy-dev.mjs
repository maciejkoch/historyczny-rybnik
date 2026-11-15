import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { configureSlotSsr } from './slot-ssr.mjs';
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const target = process.argv[2] || 'dev';
if (!['dev', 'dev-1', 'dev-2', 'dev-3'].includes(target)) throw new Error('Unknown dev target');
run('npm', ['run', 'build']);
{
  const config = JSON.parse(readFileSync('.local/firebase.dev.json', 'utf8'));
  config.functions = [
    {
      source: resolve('functions'),
      codebase: 'places-dev',
      runtime: 'nodejs22',
      ignore: ['node_modules', 'test', '*.log'],
    },
  ];
  if (target === 'dev') {
    const route = config.hosting.rewrites.find((rewrite) => rewrite.source === '/miejsca/**');
    if (!route?.function || route.function.functionId !== 'placesDevWeb')
      throw new Error('Unexpected SSR rewrite');
    route.function.pinTag = true;
  } else {
    configureSlotSsr(config, target);
  }
  writeFileSync(`.local/firebase.${target}.json`, JSON.stringify(config, null, 2) + '\n');
}
const revision = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
if (revision.status !== 0) throw new Error('Cannot determine deployment revision');
writeFileSync(
  'dist/historyczny-rybnik/browser/deployment.json',
  JSON.stringify({
    environment: target,
    revision: revision.stdout.trim(),
    branch: spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).stdout.trim(),
    deployedAt: new Date().toISOString(),
  }) + '\n',
);
// Bootstrap or update only this target. Existing pinned Hosting releases continue
// serving their pinned revision until the new Hosting release is published.
const ssrFunction = target === 'dev' ? 'placesDevWeb' : `placesDevWeb${target.slice(-1)}`;
run('npx', [
  'firebase',
  'deploy',
  '--only',
  `functions:places-dev:${ssrFunction}`,
  '--config',
  'firebase.backend.dev.json',
  '--project',
  'historyczny-rybnik',
  '--non-interactive',
]);
run('npx', [
  'firebase',
  'deploy',
  '--only',
  'hosting',
  '--config',
  `.local/firebase.${target}.json`,
  '--project',
  'historyczny-rybnik',
]);
