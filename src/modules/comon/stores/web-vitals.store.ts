import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import { WebVitalsData } from '../../../shared/models/web-vitals-data.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { TabActivityService } from '../services/tab-activity.service';
import { Injectable, signal, effect, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebVitalsStore {
  readonly #vitalsData = signal<WebVitalsData | null>(null);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);

  readonly vitalsData = this.#vitalsData.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  #requestId = 0;

  constructor() {
    effect(() => {
      this.#tabActivity.activeTab();
      this.reset(); // clear stale data immediately on tab switch
      this.loadVitals();
    });
  }

  async loadVitals(): Promise<void> {
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
        command: CHROME_COMMAND_ENUM.COLLECT_WEB_VITALS,
      });

      if (requestId !== this.#requestId) return; // stale response

      if (response?.success) {
        this.#vitalsData.set(response.data as WebVitalsData);
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
    this.#vitalsData.set(null);
    this.#isLoading.set(false);
    this.#error.set(null);
  }
}
