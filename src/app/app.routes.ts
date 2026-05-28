import { ROUTES } from '../modules/comon/constants/routes.const';
import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({ template: '<h1 class="p-4">Тут будет настройка для соцсетей ?</h1>' })
class PlaceholderComponent {}

export const routes: Routes = [
  {
    path: ROUTES.CURRENT_SITE,
    loadComponent: () =>
      import('../modules/current-site/current-site.component').then(m => m.CurrentSiteComponent),
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
    path: ROUTES.HEADINGS,
    loadComponent: () =>
      import('../modules/headings/headings.component').then(m => m.HeadingsComponent),
  },
  {
    path: '**',
    redirectTo: ROUTES.CURRENT_SITE,
  },
];
