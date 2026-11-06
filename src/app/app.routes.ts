import { Routes } from '@angular/router';
import { Atlas } from './atlas/atlas';
import { NotFound } from './not-found/not-found';
import { PLACES } from './places/catalog.generated';
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: Atlas },
  ...PLACES.map((place) => ({
    path: 'miejsca/' + place.slug,
    component: Atlas,
    data: { slug: place.slug },
  })),
  { path: '404', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
  { path: '**', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
];
