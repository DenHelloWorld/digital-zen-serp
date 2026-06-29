import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import type {
  ContentAnalysisData,
  ContentExtractionMode,
} from '../../../shared/models/content-analysis-data.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { inject, Service, signal } from '@angular/core';

@Service()
export class ContentAnalysisStore {
  readonly #data = signal<ContentAnalysisData | null>(null);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #mode = signal<ContentExtractionMode>('full');

  readonly data = this.#data.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly mode = this.#mode.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);

  async load(mode?: ContentExtractionMode): Promise<void> {
    if (mode !== undefined) this.#mode.set(mode);
    this.#isLoading.set(true);
    this.#error.set(null);

    if (!this.#isChrome) {
      this.#isLoading.set(false);
      this.#error.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    this.#data.set(null);

    try {
      const [response] = await Promise.all([
        chrome.runtime.sendMessage({
          command: CHROME_COMMAND_ENUM.ANALYZE_CONTENT,
          mode: this.#mode(),
        }),
        new Promise(r => setTimeout(r, 500)),
      ]);

      if (response?.success) {
        this.#data.set(response.data as ContentAnalysisData);
      } else {
        this.#error.set(response?.error ?? 'UNKNOWN_ERROR');
      }
    } catch {
      this.#error.set('MESSAGE_SENDING_FAILED');
    } finally {
      this.#isLoading.set(false);
    }
  }

  setMode(mode: ContentExtractionMode): void {
    this.#mode.set(mode);
    void this.load();
  }

  refresh(): void {
    void this.load();
  }
}
