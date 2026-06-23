import type { MetaTag, OgBlockStatus, ImageCheckResult } from '../../shared/models/og-data.model';
import { SchemaOgStore } from '../comon/stores/schema-og.store';
import { LoadingBarComponent } from '../ui/loading-bar/loading-bar.component';
import { LinkPreviewSimulatorComponent } from './link-preview-simulator/link-preview-simulator.component';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

type MetaTagGroup = 'og' | 'twitter' | 'facebook' | 'article' | 'basic';

const GROUP_ORDER: MetaTagGroup[] = ['og', 'twitter', 'facebook', 'article', 'basic'];
const GROUP_LABEL_KEYS: Record<MetaTagGroup, string> = {
  og: 'social.og.group_og',
  twitter: 'social.og.group_twitter',
  facebook: 'social.og.group_facebook',
  article: 'social.og.group_article',
  basic: 'social.og.group_basic',
};

@Component({
  selector: 'dz-og-social',
  imports: [TranslocoDirective, LoadingBarComponent, LinkPreviewSimulatorComponent],
  templateUrl: './og-social.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'dz-og-social p-[var(--spacing)] flex flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class OgSocialComponent {
  readonly #store = inject(SchemaOgStore);

  protected readonly tags = computed<MetaTag[]>(() => this.#store.metaTags());
  protected readonly imageChecks = computed<Map<string, ImageCheckResult>>(() =>
    this.#store.imageChecks()
  );
  protected readonly blockStatus = computed<OgBlockStatus>(() => this.#store.ogBlockStatus());
  protected readonly isLoading = computed(() => this.#store.loading());
  protected readonly error = computed(() => this.#store.error());

  protected readonly groups = computed(() => {
    const map = new Map<MetaTagGroup, MetaTag[]>();
    for (const tag of this.tags()) {
      const list = map.get(tag.group as MetaTagGroup) ?? [];
      list.push(tag);
      map.set(tag.group as MetaTagGroup, list);
    }
    return GROUP_ORDER.filter(g => map.has(g)).map(g => ({
      group: g,
      labelKey: GROUP_LABEL_KEYS[g],
      tags: map.get(g)!,
    }));
  });

  protected dotClass(status: string): string {
    if (status === 'ok') return 'bg-green-500';
    if (status === 'warning') return 'bg-orange-400';
    return 'bg-red-400';
  }

  protected badgeClass(status: string): string {
    if (status === 'ok') return 'bg-green-100 text-green-700';
    if (status === 'warning') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-600';
  }

  protected badgeLabelKey(status: string): string {
    if (status === 'ok') return 'social.status.ok';
    if (status === 'warning') return 'social.status.warning';
    if (status === 'missing') return 'social.status.missing';
    return 'social.status.invalid';
  }

  protected get blockBadge(): { labelKey: string; cls: string } {
    const s = this.blockStatus();
    if (s === 'ready')
      return { labelKey: 'social.og.status_ready', cls: 'bg-green-100 text-green-700' };
    if (s === 'needs-improvement')
      return {
        labelKey: 'social.og.status_needs_improvement',
        cls: 'bg-orange-100 text-orange-700',
      };
    return { labelKey: 'social.og.status_broken', cls: 'bg-red-100 text-red-600' };
  }

  protected imageInfo(url: string | null): string | null {
    if (!url) return null;
    const check = this.imageChecks().get(url);
    if (!check || check.loadStatus === 'error' || check.loadStatus === 'timeout') return null;
    return `${check.naturalWidth}×${check.naturalHeight}px`;
  }
}
