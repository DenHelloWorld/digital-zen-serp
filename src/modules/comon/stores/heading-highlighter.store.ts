import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import {
  HEADING_TAGS,
  HIGHLIGHTER_STATUS_CONFIG,
} from '../../../shared/helpers/heading-highlighter.helper';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { TabActivityService } from '../services/tab-activity.service';
import { computed, effect, inject, Service, signal } from '@angular/core';

function defaultSelectedTags(): Record<string, boolean> {
  return Object.fromEntries(HEADING_TAGS.map(t => [t, true]));
}

export type HighlighterStatus = 'idle' | 'ok' | 'warning' | 'error';

@Service()
export class HeadingHighlighterStore {
  readonly #isEnabled = signal(false);
  readonly #selectedTags = signal<Record<string, boolean>>(defaultSelectedTags());
  readonly #isLoading = signal(false);
  readonly #headingsFound = signal<number | null>(null);
  readonly #error = signal<string | null>(null);

  readonly isEnabled = this.#isEnabled.asReadonly();
  readonly selectedTags = this.#selectedTags.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly headingsFound = this.#headingsFound.asReadonly();
  readonly error = this.#error.asReadonly();

  readonly status = computed<HighlighterStatus>(() => {
    if (!this.#isEnabled()) return 'idle';
    if (HEADING_TAGS.every(t => !this.#selectedTags()[t])) return 'warning';
    if (this.#headingsFound() !== null && this.#headingsFound() === 0) return 'error';
    return 'ok';
  });

  readonly statusColor = computed(() => HIGHLIGHTER_STATUS_CONFIG[this.status()]);

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  constructor() {
    effect(() => {
      this.#tabActivity.activeTab();
      this.reapply();
    });
  }

  async #applyConfig(): Promise<void> {
    if (!this.#isChrome) return;

    this.#isLoading.set(true);
    this.#error.set(null);

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.HIGHLIGHT_HEADERS,
        payload: {
          enabled: this.#isEnabled(),
          selectedTags: this.#selectedTags(),
        },
      });

      if (response?.success) {
        this.#headingsFound.set(response.headingsFound ?? 0);
      } else {
        this.#error.set(response?.error || 'UNKNOWN_ERROR');
        this.#headingsFound.set(null);
      }
    } catch (err) {
      this.#error.set('MESSAGE_SENDING_FAILED');
      this.#headingsFound.set(null);
      console.error('[HeadingHighlighterStore]', err);
    } finally {
      this.#isLoading.set(false);
    }
  }

  toggleHighlighter(): void {
    this.#isEnabled.update(v => !v);
    this.#applyConfig();
  }

  toggleTag(tag: string): void {
    this.#selectedTags.update(tags => ({
      ...tags,
      [tag]: !tags[tag],
    }));

    if (this.#isEnabled()) {
      this.#applyConfig();
    }
  }

  async reapply(): Promise<void> {
    if (!this.#isEnabled()) return;
    this.#applyConfig();
  }
}
