import { RenderMode, ServerRoute } from '@angular/ssr';
export const serverRoutes: ServerRoute[] = [
  { path: 'o-nas', renderMode: RenderMode.Prerender },
  { path: 'prywatnosc', renderMode: RenderMode.Prerender },
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'szukaj', renderMode: RenderMode.Prerender },
  { path: 'miejsca/:slug', renderMode: RenderMode.Server },
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Prerender },
];
