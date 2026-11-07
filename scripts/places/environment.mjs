import { execFileSync } from 'node:child_process';
const [action, slot, task] = process.argv.slice(2);
if (
  !['reserve', 'release'].includes(action) ||
  !/^dev-[123]$/.test(slot || '') ||
  !/^PVTI_[\w-]+$/.test(task || '')
)
  throw new Error('Usage: environment.mjs reserve|release dev-1|dev-2|dev-3 PROJECT_ITEM_NODE_ID');
const git = (args, input) => execFileSync('git', args, { encoding: 'utf8', input }).trim();
const ref = `refs/heads/env-lock/${slot}`;
const remote = git(['ls-remote', 'origin', ref]).split(/\s/)[0];
if (action === 'reserve') {
  if (remote)
    throw new Error('Environment already reserved; inspect its lock commit and Project item');
  const tree = git(['rev-parse', 'HEAD^{tree}']);
  const message = JSON.stringify({
    slot,
    task,
    branch: git(['branch', '--show-current']),
    nonce: crypto.randomUUID(),
  });
  const sha = git(['commit-tree', tree, '-p', 'HEAD'], message);
  console.log(git(['push', `--force-with-lease=${ref}:`, 'origin', `${sha}:${ref}`]));
  console.log(
    `Reserved ${slot} for ${task}; lock ${sha}. Now update Project field and verify all reservations.`,
  );
} else {
  if (!remote) throw new Error('No reservation found');
  git(['fetch', 'origin', remote]);
  const owner = JSON.parse(git(['show', '-s', '--format=%B', remote]));
  if (owner.task !== task || owner.slot !== slot)
    throw new Error('Reservation belongs to another task');
  console.log(git(['push', `--force-with-lease=${ref}:${remote}`, 'origin', `:${ref}`]));
  console.log('Released lock. Clear the Project field and verify.');
}
