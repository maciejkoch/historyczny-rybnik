import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const config = JSON.parse(readFileSync('firebase.dev.json', 'utf8'));
config.hosting.public = resolve(config.hosting.public);
mkdirSync('.local', { recursive: true });
writeFileSync('.local/firebase.dev.json', JSON.stringify(config, null, 2) + '\n');
