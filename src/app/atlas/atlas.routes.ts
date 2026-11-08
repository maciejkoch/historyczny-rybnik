import { Routes } from '@angular/router';
import { Atlas } from './atlas';
import { PLACES } from '../places/catalog.generated';

export const atlasRoutes: Routes = [
  { path: '', pathMatch: 'full', component: Atlas, data: { atlas: true, screen: 'map' } },
  { path: 'szukaj', component: Atlas, data: { atlas: true, screen: 'search' } },
  ...PLACES.map((place) => ({
    path: 'miejsca/' + place.slug,
    component: Atlas,
    data: { atlas: true, screen: 'place', slug: place.slug },
  })),
];
