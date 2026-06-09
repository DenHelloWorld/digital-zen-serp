import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import { WebVitalsData, WebVitalsStrategy } from '../../../shared/models/web-vitals-data.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { TabActivityService } from '../services/tab-activity.service';
import { Injectable, signal, computed, effect, untracked, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebVitalsStore {
  /** Only successful (non-error) results — keyed by `${url}|${strategy}` */
  readonly #cache = signal<Record<string, WebVitalsData>>({});
  /** Latest fetch result per key — includes error results, for display only */
  readonly #latest = signal<Record<string, WebVitalsData>>({});
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #strategy = signal<WebVitalsStrategy>('mobile');
  readonly #lastLoadedUrl = signal<string | null>(null);

  readonly vitalsData = computed(() => {
    const url = this.#tabActivity.activeTab()?.url;
    const strategy = this.#strategy();
    if (!url) return null;
    const key = this.#key(url, strategy);
    return this.#cache()[key] ?? this.#latest()[key] ?? null;
  });

  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly strategy = this.#strategy.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  #requestId = 0;

  constructor() {
    effect(() => {
      const url = this.#tabActivity.activeTab()?.url ?? null;
      const prevUrl = untracked(() => this.#lastLoadedUrl());
      if (url && url !== prevUrl) {
        untracked(() => {
          this.#lastLoadedUrl.set(url);
          void this.#loadForUrl(url, false);
        });
      }
    });
  }

  setStrategy(strategy: WebVitalsStrategy): void {
    this.#strategy.set(strategy);
  }

  async loadVitals(): Promise<void> {
    const url = this.#tabActivity.activeTab()?.url;
    if (!url) return;
    await this.#loadForUrl(url, true);
  }

  async #loadForUrl(url: string, force: boolean): Promise<void> {
    const alreadyCached =
      !!this.#cache()[this.#key(url, 'mobile')] && !!this.#cache()[this.#key(url, 'desktop')];

    if (alreadyCached && !force) return;

    if (force) {
      // Clear latest display results so loading state is visible to the user
      this.#latest.update(l => {
        const next = { ...l };
        delete next[this.#key(url, 'mobile')];
        delete next[this.#key(url, 'desktop')];
        return next;
      });
    }

    this.#isLoading.set(true);
    this.#error.set(null);
    const requestId = ++this.#requestId;

    if (!this.#isChrome) {
      this.#isLoading.set(false);
      this.#error.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.COLLECT_WEB_VITALS_BOTH,
      });

      if (requestId !== this.#requestId) return;

      if (response?.success) {
        const both = response.data as { mobile: WebVitalsData; desktop: WebVitalsData };
        this.#storeResult(url, 'mobile', both.mobile);
        this.#storeResult(url, 'desktop', both.desktop);
      } else if (!this.#error()) {
        this.#error.set(response?.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      if (requestId !== this.#requestId) return;
      this.#error.set('MESSAGE_SENDING_FAILED');
      console.error('[WebVitalsStore]', err);
    }

    if (requestId === this.#requestId) {
      this.#isLoading.set(false);
    }
  }

  #storeResult(url: string, strategy: WebVitalsStrategy, data: WebVitalsData): void {
    const key = this.#key(url, strategy);
    if (data.errorCode) {
      // Error results: display only, not cached — so next open will auto-retry
      this.#latest.update(l => ({ ...l, [key]: data }));
    } else {
      this.#cache.update(c => ({ ...c, [key]: data }));
    }
  }

  #key(url: string, strategy: WebVitalsStrategy): string {
    return `${url}|${strategy}`;
  }
}
