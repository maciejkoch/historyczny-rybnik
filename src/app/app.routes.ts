import { Routes } from '@angular/router';
import { Atlas } from './atlas/atlas';
import { NotFound } from './not-found/not-found';
import { PrivacyPolicy } from './privacy/privacy-policy/privacy-policy';
import { PLACES } from './places/catalog.generated';
export const routes: Routes = [
  {
    path: 'prywatnosc',
    component: PrivacyPolicy,
    title: 'Prywatność i pliki cookie — Historyczny Rybnik',
  },
  { path: '', pathMatch: 'full', component: Atlas, data: { screen: 'map' } },
  { path: 'szukaj', component: Atlas, data: { screen: 'search' } },
  ...PLACES.map((place) => ({
    path: 'miejsca/' + place.slug,
    component: Atlas,
    data: { screen: 'place', slug: place.slug },
  })),
  { path: '404', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
  { path: '**', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
];
