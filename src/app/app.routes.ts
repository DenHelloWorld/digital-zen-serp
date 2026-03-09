import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({ template: '<h1 class="p-4">Тут будет настройка для соцсетей ?</h1>' })
class PlaceholderComponent {}

export const routes: Routes = [
  {
    path: 'google-serp',
    loadComponent: () =>
      import('../modules/manual-serp/manual-serp.component').then(m => m.ManualSerpComponent),
  },
  {
    path: 'current-site',
    loadComponent: () =>
      import('../modules/current-tab-serp/current-tab-serp.component').then(
        m => m.CurrentTabSerpComponent
      ),
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
