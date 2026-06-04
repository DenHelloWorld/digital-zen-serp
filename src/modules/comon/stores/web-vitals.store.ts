import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import { WebVitalsData, WebVitalsStrategy } from '../../../shared/models/web-vitals-data.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { TabActivityService } from '../services/tab-activity.service';
import { Injectable, signal, computed, effect, untracked, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebVitalsStore {
  /** Cache keyed by `${url}|${strategy}` — survives tab switches */
  readonly #cache = signal<Record<string, WebVitalsData>>({});
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #strategy = signal<WebVitalsStrategy>('mobile');
  readonly #lastLoadedUrl = signal<string | null>(null);

  readonly vitalsData = computed(() => {
    const url = this.#tabActivity.activeTab()?.url;
    const strategy = this.#strategy();
    if (!url) return null;
    return this.#cache()[this.#key(url, strategy)] ?? null;
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
      // Only fetch when URL actually changes
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

  /** Manual refresh — re-fetches even if already cached */
  async loadVitals(): Promise<void> {
    const url = this.#tabActivity.activeTab()?.url;
    if (!url) return;
    await this.#loadForUrl(url, true);
  }

  async #loadForUrl(url: string, force: boolean): Promise<void> {
    const alreadyCached =
      !!this.#cache()[this.#key(url, 'mobile')] && !!this.#cache()[this.#key(url, 'desktop')];

    if (alreadyCached && !force) return;

    this.#isLoading.set(true);
    this.#error.set(null);
    const requestId = ++this.#requestId;

    if (!this.#isChrome) {
      this.#isLoading.set(false);
      this.#error.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    await this.#fetchStrategy(url, 'mobile', requestId);
    // Small delay to avoid hitting PageSpeed API rate limit on back-to-back requests
    await new Promise(r => setTimeout(r, 1500));
    await this.#fetchStrategy(url, 'desktop', requestId);

    if (requestId === this.#requestId) {
      this.#isLoading.set(false);
    }
  }

  async #fetchStrategy(url: string, strategy: WebVitalsStrategy, requestId: number): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.COLLECT_WEB_VITALS,
        strategy,
      });

      if (requestId !== this.#requestId) return;

      if (response?.success) {
        const data = response.data as WebVitalsData;
        this.#cache.update(c => ({ ...c, [this.#key(url, strategy)]: data }));
      } else if (!this.#error()) {
        this.#error.set(response?.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      if (requestId !== this.#requestId) return;
      if (!this.#error()) {
        this.#error.set('MESSAGE_SENDING_FAILED');
      }
      console.error('[WebVitalsStore]', err);
    }
  }

  #key(url: string, strategy: WebVitalsStrategy): string {
    return `${url}|${strategy}`;
  }
}
