import type { TabInfo } from '../../../shared/models/tab-info.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { inject, Service, signal } from '@angular/core';

/**
 * Fetches the current tab once on init.
 * No tab-switch listeners needed — the panel lives inside the page
 * and is destroyed on navigation along with it.
 */
@Service()
export class TabActivityService {
  readonly #activeTab = signal<TabInfo | null>(null);
  readonly activeTab = this.#activeTab.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);

  constructor() {
    if (!this.#isChrome) return;
    void this.#fetchActiveTab();
  }

  refresh(): void {
    if (!this.#isChrome) return;
    void this.#fetchActiveTab();
  }

  async #fetchActiveTab(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab) {
        this.#activeTab.set({
          id: tab.id!,
          url: tab.url ?? '',
          title: tab.title ?? '',
          favIconUrl: tab.favIconUrl ?? '',
        });
      }
    } catch {
      /* chrome API error */
    }
  }
}
