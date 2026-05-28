import { SeoAuditViewComponent } from '../../base-seo-audit/base-seo-audit.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-site-audit-page',
  imports: [SeoAuditViewComponent],
  template: ` <dz-seo-audit-view /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'w-full flex flex-col items-center',
  },
})
export class SiteAuditPageComponent {}
