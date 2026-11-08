import { resolve } from 'node:path';
import { initWorkspace, loadWorkspace, defaultRoot } from './workspace.mjs';
const [command, ...args] = process.argv.slice(2);
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const root = resolve(value('root') || defaultRoot);
try {
  if (command === 'init') {
    await initWorkspace(root);
    console.log('Warsztat przygotowany:', root);
  } else if (command === 'validate') {
    const data = await loadWorkspace(root);
    console.log(
      Object.fromEntries(
        Object.entries(data)
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => [k, v.length]),
      ),
    );
  } else if (['push', 'pull', 'restore'].includes(command)) {
    const { storageClient } = await import('./storage.mjs');
    const { syncWorkspace } = await import('./sync.mjs');
    const store = await storageClient(args.includes('--firebase-cli'));
    await store.verifyPrivacy();
    console.log(
      JSON.stringify(
        await syncWorkspace({
          root,
          store,
          direction: command,
          apply: args.includes('--apply'),
          approveDeletions: args.includes('--approve-deletions'),
          restoreRevision: value('revision'),
        }),
        null,
        2,
      ),
    );
  } else if (command === 'migrate') {
    const { migrate } = await import('./migrate.mjs');
    console.log(
      await migrate({
        root,
        input: value('input') || 'data/places.catalog.json',
        apply: args.includes('--apply'),
      }),
    );
  } else if (command === 'hydrate') {
    const { hydrate } = await import('./hydrate.mjs');
    const { storageClient } = await import('./storage.mjs');
    console.log(
      await hydrate({
        root,
        store: await storageClient(args.includes('--firebase-cli')),
        apply: args.includes('--apply'),
      }),
    );
  } else if (command === 'assets') {
    const { prepareAssets } = await import('./assets.mjs');
    const assets = await prepareAssets(root);
    console.log(assets.map((a) => ({ path: a.path, size: a.bytes.length })));
    if (args.includes('--apply')) {
      const { storageClient } = await import('./storage.mjs');
      const store = await storageClient(args.includes('--firebase-cli'));
      for (const a of assets) await store.putPublicAsset(a.path, a.bytes, a.mime);
    }
  } else if (command === 'export') {
    const { exportCatalog } = await import('./publish.mjs');
    console.log(
      await exportCatalog({
        root,
        output: value('output') || '.local/research.catalog.json',
        apply: args.includes('--apply'),
      }),
    );
  } else if (command === 'report') {
    const d = await loadWorkspace(root);
    const r =
      d.research.find((r) => r.id === value('id')) ||
      d.research.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    console.log(
      r
        ? `${r.summary}\n${r.changes.map((c) => `${c.collection}: ${c.action} ${c.id}`).join('\n')}${r.limitations.length ? '\nDo wyjaśnienia: ' + r.limitations.join('; ') : ''}`
        : 'Brak zapisanych badań.',
    );
  } else
    throw new Error(
      'Użycie: research init|validate|migrate|export|pull|push|restore|report [--root=...] [--apply]',
    );
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
