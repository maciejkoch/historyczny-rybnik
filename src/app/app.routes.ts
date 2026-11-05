import { Routes } from '@angular/router';
import { Atlas } from './atlas/atlas';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  { path: '', component: Atlas, title: 'Historyczny Rybnik — miejsca i ich historie' },
  { path: '404', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
  { path: '**', component: NotFound, title: 'Nie znaleziono strony — Historyczny Rybnik' },
];
