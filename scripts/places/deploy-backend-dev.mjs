import { spawnSync } from 'node:child_process';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw new Error(`${command} failed`);
};
run('npm', ['run', 'build']);
run('npx', [
  'firebase',
  'deploy',
  '--config',
  'firebase.backend.dev.json',
  '--project',
  'historyczny-rybnik',
  '--only',
  'functions:places-dev:placesDevRead,functions:places-dev:placesDevUpdate,functions:places-dev:placesDevCreate,functions:places-dev:placesDevSave,functions:places-dev:placesDevWeb,firestore:places-dev,storage:places-dev,auth',
]);
