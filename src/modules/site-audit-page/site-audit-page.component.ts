import { SeoAuditViewComponent } from '../base-seo-audit/base-seo-audit.component';
import { HeadingHighlighterComponent } from '../heading-highlighter/heading-highlighter.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-site-audit-page',
  imports: [SeoAuditViewComponent, HeadingHighlighterComponent],
  template: `
    <ng-container>
      <dz-seo-audit-view />
      <dz-heading-highlighter />
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'dz-site-audit-page flex flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class SiteAuditPageComponent {}
