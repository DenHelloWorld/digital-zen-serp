import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { CHROME_COMMAND_ENUM } from '../enums/chrome-command.enum';
import { HEADING_TAGS, HIGHLIGHTER_STATUS_CONFIG } from '../helpers/heading-highlighter.helper';
import { Injectable, signal, computed, inject } from '@angular/core';

function defaultSelectedTags(): Record<string, boolean> {
  return Object.fromEntries(HEADING_TAGS.map(t => [t, true]));
}

export interface HeadingHighlighterState {
  enabled: boolean;
  selectedTags: Record<string, boolean>;
}

export type HighlighterStatus = 'idle' | 'ok' | 'warning' | 'error';

@Injectable({ providedIn: 'root' })
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

    // Если фича включена — применяем изменения сразу
    if (this.#isEnabled()) {
      this.#applyConfig();
    }
  }

  /** Переприменить подсветку (при смене таба / обновлении страницы) */
  async reapply(): Promise<void> {
    if (!this.#isEnabled()) return;
    this.#applyConfig();
  }

  /** Выключить подсветку (fire-and-forget — без ожидания ответа) */
  turnOff(): void {
    if (!this.#isEnabled() || !this.#isChrome) return;

    this.#isEnabled.set(false);
    this.#headingsFound.set(null);

    chrome.runtime
      .sendMessage({
        command: CHROME_COMMAND_ENUM.HIGHLIGHT_HEADERS,
        payload: { enabled: false, selectedTags: this.#selectedTags() },
      })
      .catch(() => {
        /* empty */
      });
  }

  reset(): void {
    this.#isEnabled.set(false);
    this.#selectedTags.set(defaultSelectedTags());
    this.#isLoading.set(false);
    this.#headingsFound.set(null);
    this.#error.set(null);
  }
}
