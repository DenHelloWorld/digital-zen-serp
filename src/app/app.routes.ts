import { ROUTES } from '../modules/comon/constants/routes.const';
import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({ template: '<h1 class="p-4">Тут будет настройка для соцсетей ?</h1>' })
class PlaceholderComponent {}

export const routes: Routes = [
  {
    path: ROUTES.GOOGLE_SERP,
    loadComponent: () =>
      import('../modules/manual-serp/manual-serp.component').then(m => m.ManualSerpComponent),
  },
  {
    path: ROUTES.CURRENT_SITE,
    loadComponent: () =>
      import('../modules/current-tab-serp/current-tab-serp.component').then(
        m => m.CurrentTabSerpComponent
      ),
  },
  {
    path: ROUTES.SOCIAL,
    component: PlaceholderComponent,
  },
  {
    path: ROUTES.SEO_AUDIT,
    loadComponent: () =>
      import('../modules/site-audit-page/site-audit-page.component').then(
        m => m.SiteAuditPageComponent
      ),
  },
  {
    path: '**',
    redirectTo: ROUTES.GOOGLE_SERP,
  },
];
