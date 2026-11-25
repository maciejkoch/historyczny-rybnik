import { About } from './about/about';
import { Routes } from '@angular/router';
import { NotFound } from './not-found/not-found';
import { PrivacyPolicy } from './privacy/privacy-policy/privacy-policy';
import { creatorGuard } from './creator/creator-guard';
export const routes: Routes = [
  {
    path: 'kreator',
    canActivate: [creatorGuard],
    loadComponent: () => import('./creator/creator-list/creator-list').then((m) => m.CreatorList),
    title: 'Kreator miejsc — Historyczny Rybnik',
  },
  {
    path: 'kreator/:id',
    canActivate: [creatorGuard],
    loadComponent: () =>
      import('./creator/creator-draft/creator-draft').then((m) => m.CreatorDraft),
    title: 'Szkic miejsca — Historyczny Rybnik',
  },
  { path: 'o-nas', component: About, title: 'O nas — Historyczny Rybnik' },
  {
    path: 'prywatnosc',
    component: PrivacyPolicy,
    title: 'Prywatność — Historyczny Rybnik',
  },
  { path: '', loadChildren: () => import('./atlas/atlas.routes').then((m) => m.atlasRoutes) },
  { path: '404', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
  { path: '**', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
];
