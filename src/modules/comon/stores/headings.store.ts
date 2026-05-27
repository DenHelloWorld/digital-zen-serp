import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { CHROME_COMMAND_ENUM } from '../enums/chrome-command.enum';
import { validateHeadings } from '../helpers/heading-parser.helper';
import type { HeadingData } from '../models/heading-data.model';
import { TabActivityService } from '../services/tab-activity.service';
import { Injectable, signal, computed, effect, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HeadingsStore {
  readonly #headingsData = signal<HeadingData[] | null>(null);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);

  readonly headingsData = this.#headingsData.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  readonly headingsCount = computed(() => this.#headingsData()?.length ?? null);

  readonly hasErrors = computed(() => {
    const data = this.#headingsData();
    return data !== null && data.some(h => h.errors.length > 0);
  });

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  constructor() {
    effect(() => {
      this.#tabActivity.activeTab();
      this.loadHeadings();
    });
  }

  async loadHeadings(): Promise<void> {
    this.#isLoading.set(true);
    this.#error.set(null);

    if (!this.#isChrome) {
      this.#isLoading.set(false);
      this.#error.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.PARSE_HEADINGS,
      });

      if (response?.success) {
        const raw = (response.data ?? []) as HeadingData[];
        this.#headingsData.set(validateHeadings(raw));
      } else {
        this.#error.set(response?.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      this.#error.set('MESSAGE_SENDING_FAILED');
      console.error('[HeadingsStore]', err);
    } finally {
      this.#isLoading.set(false);
    }
  }

  reset(): void {
    this.#headingsData.set(null);
    this.#isLoading.set(false);
    this.#error.set(null);
  }
}
