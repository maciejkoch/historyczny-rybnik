import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { loadWorkspace, defaultRoot, safePath } from './workspace.mjs';
const repo = fileURLToPath(new URL('../../', import.meta.url));
export async function createViewer({ root = defaultRoot, port = 4319 } = {}) {
  const cssPath = resolve(repo, 'tools/research-viewer/input.css');
  const css = (
    await postcss([tailwind({ base: repo, optimize: true })]).process(
      await readFile(cssPath, 'utf8'),
      { from: cssPath },
    )
  ).css;
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.pdf': 'application/pdf',
  };
  const server = createServer(async (req, res) => {
    const headers = {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      'Referrer-Policy': 'no-referrer',
    };
    const send = (status, type, body) => {
      res.writeHead(status, {
        ...headers,
        'Content-Type': type,
        ...(type === 'application/octet-stream' ? { 'Content-Disposition': 'attachment' } : {}),
      });
      res.end(body);
    };
    try {
      if (
        req.headers.host !== `127.0.0.1:${server.address().port}` ||
        !['GET', 'HEAD'].includes(req.method) ||
        (req.headers.origin && req.headers.origin !== `http://127.0.0.1:${server.address().port}`)
      )
        return send(403, 'text/plain', 'Local read-only viewer');
      const path = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (path === '/api/workspace') {
        try {
          return send(200, 'application/json', JSON.stringify(await loadWorkspace(root)));
        } catch (e) {
          return send(422, 'application/json', JSON.stringify({ error: e.message }));
        }
      }
      if (path === '/viewer.css') return send(200, mime['.css'], css);
      let file;
      const routes = {
        '/': 'tools/research-viewer/index.html',
        '/app.js': 'tools/research-viewer/app.js',
        '/vendor/maplibre-gl.mjs': 'node_modules/maplibre-gl/dist/maplibre-gl.mjs',
        '/vendor/maplibre-gl-shared.mjs': 'node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs',
        '/vendor/maplibre-gl-worker.mjs': 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs',
        '/vendor/maplibre-gl.css': 'node_modules/maplibre-gl/dist/maplibre-gl.css',
      };
      if (routes[path]) file = resolve(repo, routes[path]);
      else if (/^\/maptiles\/\d{1,2}\/\d{1,7}\/\d{1,7}\.webp$/.test(path))
        file = resolve(repo, 'public/maps/rybnik-1932', path.slice(10));
      else if (path.startsWith('/files/'))
        file = await safePath(resolve(root, 'files'), path.slice(7));
      else return send(404, 'text/plain', 'Not found');
      const ext = extname(file).toLowerCase();
      const type =
        path.startsWith('/files/') && !['.png', '.jpg', '.jpeg', '.webp', '.pdf'].includes(ext)
          ? 'application/octet-stream'
          : mime[ext] || 'application/octet-stream';
      if ((await stat(file)).size > 200000000) return send(413, 'text/plain', 'File too large');
      send(200, type, req.method === 'HEAD' ? '' : await readFile(file));
    } catch (e) {
      send(e.code === 'ENOENT' ? 404 : 400, 'text/plain', 'File unavailable');
    }
  });
  await new Promise((yes, no) => {
    server.once('error', no);
    server.listen(port, '127.0.0.1', yes);
  });
  return server;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv.find((a) => a.startsWith('--root='))?.slice(7) || defaultRoot;
  const server = await createViewer({
    root: resolve(root),
    port: Number(process.env.RESEARCH_PORT || 4319),
  });
  console.log(`Warsztat lokalny: http://127.0.0.1:${server.address().port}`);
}
