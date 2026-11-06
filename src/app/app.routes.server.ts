import { RenderMode, ServerRoute } from '@angular/ssr';
import { PLACES } from './places/catalog.generated';
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'szukaj', renderMode: RenderMode.Prerender },
  ...PLACES.map((place): ServerRoute => ({
    path: 'miejsca/' + place.slug,
    renderMode: RenderMode.Prerender,
  })),
  { path: '404', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Prerender },
];
