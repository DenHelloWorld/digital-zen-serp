import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { CHROME_COMMAND_ENUM } from '../enums/chrome-command.enum';
import { GooglePreviewData } from '../models/google-preview-data.model';
import { TabActivityService } from '../services/tab-activity.service';
import { Injectable, signal, effect, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GooglePreviewStore {
  readonly #activeTab = signal<chrome.tabs.Tab | null>(null);
  readonly #currentTabPreview = signal<GooglePreviewData | null>(null);
  readonly #isTabLoading = signal(false);
  readonly #isPreviewLoading = signal(false);
  readonly #tabError = signal<string | null>(null);
  readonly #previewError = signal<string | null>(null);

  readonly activeTab = this.#activeTab.asReadonly();
  readonly currentTabPreview = this.#currentTabPreview.asReadonly();
  readonly isTabLoading = this.#isTabLoading.asReadonly();
  readonly isPreviewLoading = this.#isPreviewLoading.asReadonly();
  readonly tabError = this.#tabError.asReadonly();
  readonly previewError = this.#previewError.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  constructor() {
    effect(() => {
      this.#tabActivity.activeTab();
      this.getActiveTab();
      this.loadPreview();
    });
  }

  async loadPreview(): Promise<void> {
    this.#isPreviewLoading.set(true);
    this.#previewError.set(null);

    if (!this.#isChrome) {
      this.#isPreviewLoading.set(false);
      this.#previewError.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.SCRAP_CURRENT_TAB,
      });

      if (response?.success) {
        this.#currentTabPreview.set(response.data);
      } else {
        this.#previewError.set(response?.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      this.#previewError.set('MESSAGE_SENDING_FAILED');
      console.error('[GooglePreviewStore]', err);
    } finally {
      this.#isPreviewLoading.set(false);
    }
  }

  async getActiveTab() {
    this.#isTabLoading.set(true);
    this.#tabError.set(null);

    if (!this.#isChrome) {
      this.#isTabLoading.set(false);
      this.#tabError.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.GET_ACTIVE_TAB,
      });

      if (response?.success) {
        this.#activeTab.set(response.tab);
      } else {
        this.#tabError.set(response?.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      this.#tabError.set('MESSAGE_SENDING_FAILED');
      console.error('[GooglePreviewStore]', err);
    } finally {
      this.#isTabLoading.set(false);
    }
  }

  reset(): void {
    this.#activeTab.set(null);
    this.#currentTabPreview.set(null);
    this.#isTabLoading.set(false);
    this.#isPreviewLoading.set(false);
    this.#tabError.set(null);
    this.#previewError.set(null);
  }
}
