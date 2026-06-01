import { ROUTES } from '../modules/comon/constants/routes.const';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: ROUTES.CURRENT_SITE,
    loadComponent: () =>
      import('../modules/pages/current-site-page/current-site-page.component').then(
        m => m.CurrentSitePageComponent
      ),
  },
  {
    path: ROUTES.SOCIAL,
    loadComponent: () =>
      import('../modules/pages/social-page/social-page.component').then(m => m.SocialPageComponent),
  },
  {
    path: ROUTES.SEO_AUDIT,
    loadComponent: () =>
      import('../modules/pages/site-audit-page/site-audit-page.component').then(
        m => m.SiteAuditPageComponent
      ),
  },
  {
    path: ROUTES.HEADINGS,
    loadComponent: () =>
      import('../modules/pages/headings-page/headings-page.component').then(
        m => m.HeadingsPageComponent
      ),
  },
  {
    path: ROUTES.PERFORMANCE,
    loadComponent: () =>
      import('../modules/pages/performance-page/performance-page.component').then(
        m => m.PerformancePageComponent
      ),
  },
  {
    path: '**',
    redirectTo: ROUTES.CURRENT_SITE,
  },
];
