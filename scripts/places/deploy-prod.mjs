import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`${command} failed`);
  return result.stdout?.trim();
};
if (run('git', ['status', '--porcelain'], { capture: true })) {
  throw new Error('Production deployment requires a clean checkout');
}
const revision = run('git', ['rev-parse', 'HEAD'], { capture: true });
const branch = run('git', ['branch', '--show-current'], { capture: true });
run('npm', ['run', 'prepare:prod']);
run('npm', ['ci', '--prefix', '.local/functions-prod', '--omit=dev', '--no-audit', '--no-fund']);
writeFileSync(
  'dist/historyczny-rybnik/browser/deployment.json',
  JSON.stringify({
    environment: 'prod',
    revision,
    branch,
    deployedAt: new Date().toISOString(),
  }) + '\n',
);
const firebase = (only, config) =>
  run('npx', [
    'firebase',
    'deploy',
    '--project',
    'historyczny-rybnik',
    '--config',
    config,
    '--only',
    only,
    '--non-interactive',
  ]);
// Apply scoped rules and deploy each production function without touching dev or Auth.
firebase('firestore:places-prod,storage:places-prod', '.local/firebase.backend.prod.json');
firebase(
  'functions:places-prod:placesProdRead,functions:places-prod:placesProdUpdate,functions:places-prod:placesProdWeb',
  '.local/firebase.backend.prod.json',
);
// The hosting config pins the deployed SSR revision to the release.
firebase('hosting', '.local/firebase.hosting.prod.json');
