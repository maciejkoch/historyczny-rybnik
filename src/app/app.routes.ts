import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';
import { PrivacyPolicy } from './privacy/privacy-policy/privacy-policy';
export const routes: Routes = [
  {
    path: 'prywatnosc',
    component: PrivacyPolicy,
    title: 'Prywatność — Historyczny Rybnik',
  },
  { path: '', loadChildren: () => import('./atlas/atlas.routes').then((m) => m.atlasRoutes) },
  { path: '404', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
  { path: '**', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
];
