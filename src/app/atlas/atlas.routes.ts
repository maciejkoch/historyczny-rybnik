import { Routes } from '@angular/router';
import { Atlas } from './atlas';
import { placeResolver } from '../places/public-places';

export const atlasRoutes: Routes = [
  { path: '', pathMatch: 'full', component: Atlas, data: { atlas: true, screen: 'map' } },
  { path: 'szukaj', component: Atlas, data: { atlas: true, screen: 'search' } },
  {
    path: 'miejsca/:slug',
    component: Atlas,
    data: { atlas: true, screen: 'place' },
    resolve: { place: placeResolver },
    runGuardsAndResolvers: 'paramsChange',
  },
];
