import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'google-serp',
    loadComponent: () =>
      import('../modules/google-serp/google-serp.component').then(m => m.GoogleSerpComponent),
  },
  {
    path: '**',
    redirectTo: 'google-serp',
  },
];
