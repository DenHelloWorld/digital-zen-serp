import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({ template: '<h1 class="p-4">Тут будет настройка для соцсетей ?</h1>' })
class PlaceholderComponent {}

export const routes: Routes = [
  {
    path: 'google-serp',
    loadComponent: () =>
      import('../modules/google-serp/google-serp.component').then(m => m.GoogleSerpComponent),
  },
  {
    path: 'social',
    component: PlaceholderComponent,
  },
  {
    path: '**',
    redirectTo: 'google-serp',
  },
];
