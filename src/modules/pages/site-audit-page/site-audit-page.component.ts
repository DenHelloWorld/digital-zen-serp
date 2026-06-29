import { BaseSeoAuditComponent } from '../../base-seo-audit/base-seo-audit.component';
import { SeoIndexabilityComponent } from '../../seo-indexability/seo-indexability.component';
import { Component } from '@angular/core';

@Component({
  selector: 'dz-site-audit-page',
  imports: [BaseSeoAuditComponent, SeoIndexabilityComponent],
  template: `
    <dz-base-seo-audit />
    <dz-seo-indexability />
  `,
  host: {
    class:
      'w-full flex flex-col items-center p-[var(--spacing)] gap-[var(--spacing)] max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class SiteAuditPageComponent {}
