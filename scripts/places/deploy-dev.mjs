import { spawnSync } from 'node:child_process';
const run = (command, args, env = process.env) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const operator = process.env['PLACES_USE_FIREBASE_CLI'] === '1' ? ['--firebase-cli'] : [];
run(process.execPath, ['scripts/places/snapshot.mjs', ...operator], {
  ...process.env,
  GCLOUD_PROJECT: 'historyczny-rybnik',
});
run('npm', ['run', 'build'], { ...process.env, PLACES_SNAPSHOT: '.local/places.snapshot.json' });
run('npx', [
  'firebase',
  'deploy',
  '--only',
  'hosting',
  '--config',
  'firebase.dev.json',
  '--project',
  'historyczny-rybnik',
]);
