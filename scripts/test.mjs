import { spawnSync } from 'node:child_process';

// Keep the complete, fail-fast test sequence in one place.
const steps = [
  ['run', 'test:maps'],
  ['run', 'test:places-filter'],
  ['run', 'check:contracts'],
  ['run', 'test:privacy'],
  ['--prefix', 'functions', 'test'],
  ['run', 'test:research'],
];

for (const args of steps) {
  const npmCli = process.env['npm_execpath'];
  const command = npmCli ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(command, npmCli ? [npmCli, ...args] : args, {
    stdio: 'inherit',
    shell: !npmCli && process.platform === 'win32',
  });
  if (result.error) {
    console.error(`Nie udało się uruchomić npm ${args.join(' ')}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
