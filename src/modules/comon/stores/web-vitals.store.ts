import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import { WebVitalsData, WebVitalsStrategy } from '../../../shared/models/web-vitals-data.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { TabActivityService } from '../services/tab-activity.service';
import { Injectable, signal, computed, effect, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebVitalsStore {
  readonly #cache = signal<Partial<Record<WebVitalsStrategy, WebVitalsData>>>({});
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #strategy = signal<WebVitalsStrategy>('mobile');

  readonly vitalsData = computed(() => this.#cache()[this.#strategy()] ?? null);
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly strategy = this.#strategy.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  #requestId = 0;

  constructor() {
    // Reset cache when tab changes — data becomes stale
    effect(() => {
      this.#tabActivity.activeTab();
      this.reset();
    });
  }

  setStrategy(strategy: WebVitalsStrategy): void {
    this.#strategy.set(strategy);
    // Use cache if available, otherwise fetch
    if (!this.#cache()[strategy]) {
      this.loadVitals();
    }
  }

  async loadVitals(): Promise<void> {
    this.#isLoading.set(true);
    this.#error.set(null);
    const requestId = ++this.#requestId;
    const strategy = this.#strategy();

    if (!this.#isChrome) {
      this.#isLoading.set(false);
      this.#error.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.COLLECT_WEB_VITALS,
        strategy,
      });

      if (requestId !== this.#requestId) return;

      if (response?.success) {
        const data = response.data as WebVitalsData;
        this.#cache.update(c => ({ ...c, [strategy]: data }));
      } else {
        this.#error.set(response?.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      if (requestId !== this.#requestId) return;
      this.#error.set('MESSAGE_SENDING_FAILED');
      console.error('[WebVitalsStore]', err);
    } finally {
      if (requestId === this.#requestId) {
        this.#isLoading.set(false);
      }
    }
  }

  reset(): void {
    ++this.#requestId; // invalidate any in-flight request
    this.#cache.set({});
    this.#isLoading.set(false);
    this.#error.set(null);
  }
}
