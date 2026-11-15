import { readFileSync } from 'node:fs';

const data = JSON.parse(
  readFileSync(new URL('./workspace.fixture.json', import.meta.url), 'utf8'),
);

export function fixture() {
  return structuredClone(data);
}
