import { isHttpUrl } from '../../shared/helpers/is-http-url.helper';
import {
  truncateText,
  getBarCount,
  getTitleColor,
  getDescriptionColor,
  getLinkColor,
} from '../../shared/helpers/serp-bar.helper';
import { CHAR_LIMITS } from '../comon/constants/char-limits.const';
import { ICONS } from '../comon/constants/icons.const';
import { FaviconHelper } from '../comon/helpers/favicon.helper';
import { cleanProtocol, cleanUrl } from '../comon/helpers/url.helper';
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

  protected readonly url = computed(() => cleanProtocol(cleanUrl(this.activeTab()?.url ?? '')));

  protected readonly name = computed(() => this.currentTabPreview()?.author ?? '');

  protected readonly title = computed(() => this.currentTabPreview()?.title ?? '');
  protected readonly titlePreview = computed(() => truncateText(this.title(), CHAR_LIMITS.title));
  protected readonly titleSegments = computed(() => {
    const len = this.title().length;
    return {
      count: getBarCount(len, CHAR_LIMITS.title),
      color: getTitleColor(len),
    };
  });

  protected readonly description = computed(() => this.currentTabPreview()?.description ?? '');
  protected readonly descriptionSegments = computed(() => {
    const len = this.description().length;
    return {
      count: getBarCount(len, CHAR_LIMITS.description),
      color: getDescriptionColor(len),
    };
  });
  protected readonly descriptionPreview = computed(() =>
    truncateText(this.description(), CHAR_LIMITS.description)
  );

  protected readonly link = computed(() => this.currentTabPreview()?.url ?? '');
  protected readonly linkSegments = computed(() => {
    const len = this.link().length;
    return {
      count: getBarCount(len, CHAR_LIMITS.link),
      color: getLinkColor(len),
    };
  });
  protected readonly linkPreview = computed(() => truncateText(this.link(), CHAR_LIMITS.link));

  protected iconUrl = computed(() => FaviconHelper.getGoogleUrl(cleanUrl(this.activeTab()?.url)));

  protected readonly charLimits = CHAR_LIMITS;
  protected readonly icons = ICONS;
  protected readonly isHttpUrl = isHttpUrl;
}
