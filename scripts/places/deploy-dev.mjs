import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const target = process.argv[2] || 'dev';
if (!['dev', 'dev-1', 'dev-2', 'dev-3'].includes(target)) throw new Error('Unknown dev target');
const operator = process.env['PLACES_USE_FIREBASE_CLI'] === '1' ? ['--firebase-cli'] : [];
run(process.execPath, ['scripts/places/snapshot.mjs', ...operator], {
  ...process.env,
  GCLOUD_PROJECT: 'historyczny-rybnik',
});
run('npm', ['run', 'build'], { ...process.env, PLACES_SNAPSHOT: '.local/places.snapshot.json' });
if (target !== 'dev') {
  const config = JSON.parse(readFileSync('firebase.dev.json', 'utf8'));
  config.hosting.site = `historyczny-rybnik-${target}`;
  writeFileSync(`firebase.${target}.json`, JSON.stringify(config, null, 2) + '\n');
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
run('npx', [
  'firebase',
  'deploy',
  '--only',
  'hosting',
  '--config',
  `firebase.${target}.json`,
  '--project',
  'historyczny-rybnik',
]);
