import { SeoAuditData, SeoAuditStatus } from '../../shared/models/seo-audit-data.model';
import { SeoAuditStore } from '../comon/stores/seo-audit.store';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

export interface IndexRow {
  labelKey: string;
  value: string | null;
  status: SeoAuditStatus;
  link?: boolean;
}

@Component({
  selector: 'dz-seo-indexability',
  imports: [TranslocoDirective],
  templateUrl: './seo-indexability.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-[var(--spacing)] w-full' },
})
export class SeoIndexabilityComponent {
  readonly #store = inject(SeoAuditStore);

  protected readonly rows = computed((): IndexRow[] => {
    const d = this.#store.auditData();
    if (!d) return [];
    return [
      this.#robotsMetaRow(d),
      this.#xRobotsRow(d),
      this.#canonicalRow(d),
      this.#canonicalMatchRow(d),
      this.#hreflangRow(d),
      this.#robotsTxtRow(d),
    ];
  });

  #robotsMetaRow(d: SeoAuditData): IndexRow {
    const v = d.robotsMeta;
    const isNoindex = v?.toLowerCase().includes('noindex') ?? false;
    return {
      labelKey: 'seoAudit.index.robots_meta',
      value: v,
      status: !v ? 'missing' : isNoindex ? 'bad' : 'ok',
    };
  }

  #xRobotsRow(d: SeoAuditData): IndexRow {
    const v = d.xRobotsTag;
    const isNoindex = v?.toLowerCase().includes('noindex') ?? false;
    return {
      labelKey: 'seoAudit.index.x_robots',
      value: v,
      status: !v || !isNoindex ? 'ok' : 'bad',
    };
  }

  #canonicalRow(d: SeoAuditData): IndexRow {
    return {
      labelKey: 'seoAudit.index.canonical',
      value: d.canonical,
      status: d.canonical ? 'ok' : 'missing',
      link: !!d.canonical,
    };
  }

  #canonicalMatchRow(d: SeoAuditData): IndexRow {
    const { canonical, url } = d;
    const status: SeoAuditStatus = !canonical ? 'missing' : canonical === url ? 'ok' : 'bad';
    return { labelKey: 'seoAudit.index.canonical_match', value: canonical ?? url, status };
  }

  #hreflangRow(d: SeoAuditData): IndexRow {
    const tags = d.hreflang;
    return {
      labelKey: 'seoAudit.index.hreflang',
      value: tags ? tags.join(', ') : null,
      status: tags && tags.length > 0 ? 'ok' : 'missing',
    };
  }

  #robotsTxtRow(d: SeoAuditData): IndexRow {
    const s = d.robotsTxtStatus;
    const status: SeoAuditStatus =
      s == null || s === 0 ? 'missing' : s >= 200 && s < 300 ? 'ok' : 'bad';
    const origin = (() => {
      try {
        return new URL(d.url).origin;
      } catch {
        return null;
      }
    })();
    return {
      labelKey: 'seoAudit.index.robots_txt',
      value: origin ? `${origin}/robots.txt` : null,
      status,
      link: true,
    };
  }
}
