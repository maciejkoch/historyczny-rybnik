import { cpSync, rmSync } from 'node:fs';

// Only generated server output is packaged; browser assets remain in Hosting.
rmSync('functions/ssr', { recursive: true, force: true });
cpSync('dist/historyczny-rybnik/server', 'functions/ssr', { recursive: true });
