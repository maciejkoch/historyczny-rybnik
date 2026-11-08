import {fixture} from '../../scripts/research/test/fixtures.mjs';
import {initWorkspace,atomicWrite,safePath} from '../../scripts/research/workspace.mjs';
const root='/private/tmp/rybnik-research-demo';await initWorkspace(root);
for(const [key,rows] of Object.entries(fixture()))if(['config','tags'].includes(key))await atomicWrite(await safePath(root,key+'.json'),JSON.stringify(rows));else for(const row of rows)await atomicWrite(await safePath(root,`${key}/${row.id}.json`),JSON.stringify(row));
