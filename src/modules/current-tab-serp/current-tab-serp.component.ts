import { CHAR_LIMITS } from '../comon/constants/char-limits.const';
import { ICONS } from '../comon/constants/icons.const';
import { cleanProtocolHelper } from '../comon/helpers/clean-protocol.helper';
import { cleanUrlHelper } from '../comon/helpers/clean-url.helper';
import { FaviconHelper } from '../comon/helpers/favicon.helper';
import { isHttpUrl } from '../comon/helpers/is-http-url.helper';
import { GooglePreviewStore } from '../comon/stores/google-preview.store';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-current-tab-serp',
  imports: [TranslocoDirective, ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './current-tab-serp.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'dz-current-tab-serp p-[var(--spacing)] flex justify-center flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class CurrentTabSerpComponent {
  protected readonly store = inject(GooglePreviewStore);

  protected readonly currentTabPreview = computed(() => this.store.currentTabPreview());
  protected readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');

  protected readonly activeTab = computed(() => this.store.activeTab());

  protected readonly url = computed(() =>
    cleanProtocolHelper(cleanUrlHelper(this.activeTab()?.url ?? ''))
  );

  protected readonly name = computed(() => this.currentTabPreview()?.author ?? '');

  protected readonly title = computed(() => this.currentTabPreview()?.title ?? '');
  protected readonly titlePreview = computed(() =>
    this.truncateText(this.title(), CHAR_LIMITS.title)
  );
  protected readonly titleSegments = computed(() => {
    const len = this.title().length;
    return {
      count: this.getBarCount(len, CHAR_LIMITS.title),
      color: this.getTitleColor(len),
    };
  });

  protected readonly description = computed(() => this.currentTabPreview()?.description ?? '');
  protected readonly descriptionSegments = computed(() => {
    const len = this.description().length;
    return {
      count: this.getBarCount(len, CHAR_LIMITS.description),
      color: this.getDescriptionColor(len),
    };
  });
  protected readonly descriptionPreview = computed(() =>
    this.truncateText(this.description(), CHAR_LIMITS.description)
  );

  protected readonly link = computed(() => this.currentTabPreview()?.url ?? '');
  protected readonly linkSegments = computed(() => {
    const len = this.link().length;
    return {
      count: this.getBarCount(len, CHAR_LIMITS.link),
      color: this.getLinkColor(len),
    };
  });
  protected readonly linkPreview = computed(() => this.truncateText(this.link(), CHAR_LIMITS.link));

  protected iconUrl = computed(() =>
    FaviconHelper.getGoogleUrl(cleanUrlHelper(this.activeTab()?.url))
  );

  protected readonly charLimits = CHAR_LIMITS;
  protected readonly icons = ICONS;
  protected readonly isHttpUrl = isHttpUrl;

  private truncateText(value: string, limit: number): string {
    if (!value) return '';
    return value.length <= limit ? value : `${value.slice(0, limit)}\u2026`;
  }

  private getBarCount(length: number, limit: number): number {
    if (length === 0) return 0;
    return Math.min(5, Math.ceil((length / limit) * 5));
  }

  private getTitleColor(length: number): string {
    if (length === 0) return 'bg-gray-200';
    if (length < 20) return 'bg-red-500';
    if (length <= 30) return 'bg-orange-500';
    if (length <= CHAR_LIMITS.title) return 'bg-green-500';
    return 'bg-red-500';
  }

  private getDescriptionColor(length: number): string {
    if (length === 0) return 'bg-gray-200';
    if (length < 70) return 'bg-red-500';
    if (length <= 100) return 'bg-orange-500';
    if (length <= CHAR_LIMITS.description) return 'bg-green-500';
    return 'bg-red-500';
  }

  private getLinkColor(length: number): string {
    if (length === 0) return 'bg-gray-200';
    if (length <= CHAR_LIMITS.link) return 'bg-green-500';
    return 'bg-red-500';
  }
}
