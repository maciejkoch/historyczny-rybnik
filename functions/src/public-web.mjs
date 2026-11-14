import { readPublicPlace, readPublicSummaries } from './public-places.mjs';

const origin = 'https://historyczny-rybnik-dev.web.app';
export function publicWeb(db, render) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
    const url = new URL(req.originalUrl, origin);
    try {
      if (url.pathname === '/api/public-places') return res.json(await readPublicSummaries(db));
      if (url.pathname === '/sitemap.xml') {
        const places = await readPublicSummaries(db);
        const paths = ['/', '/o-nas', ...places.map((place) => '/miejsca/' + place.slug)];
        return res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
          paths.map((path) => '<url><loc>' + origin + path + '</loc></url>').join('') + '</urlset>');
      }
      const match = /^\/(api\/public-places|miejsca)\/([^/]+)$/.exec(url.pathname);
      if (!match) return res.status(404).end();
      const place = await readPublicPlace(db, decodeURIComponent(match[2]));
      if (!place) return res.status(404).end();
      if (match[1] === 'api/public-places') return res.json(place);
      if (match[2] !== place.slug) return res.redirect(301, '/miejsca/' + place.slug);
      const request = new Request(origin + url.pathname + url.search, { method: req.method });
      const result = await render(request, { place });
      if (!result) return res.status(404).end();
      res.status(result.status);
      for (const [name, value] of result.headers) {
        if (!['cache-control', 'x-robots-tag'].includes(name.toLowerCase())) res.set(name, value);
      }
      return res.send(await result.text());
    } catch {
      return res.status(503).type('text/plain').send('Dane miejsc są chwilowo niedostępne.');
    }
  };
}
