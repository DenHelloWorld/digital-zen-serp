import type { TabInfo } from '../../../shared/models/tab-info.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { Injectable, signal, inject } from '@angular/core';

/**
 * Centralises Chrome tab-event listeners so that every store
 * can react to tab switches and page loads through a single signal.
 *
 * On each tab activation or page load (status === 'complete')
 * it queries the active tab and stores a lightweight TabInfo.
 */
@Injectable({ providedIn: 'root' })
export class TabActivityService {
  readonly #activeTab = signal<TabInfo | null>(null);
  readonly activeTab = this.#activeTab.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);

  constructor() {
    if (!this.#isChrome) return;

    this.#refreshActiveTab();

    chrome.tabs.onActivated.addListener(() => this.#refreshActiveTab());

    chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
      if (changeInfo.status === 'complete') {
        this.#refreshActiveTab();
      }
    });
  }

  async #refreshActiveTab(): Promise<void> {
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
      /* chrome API error — keep previous value */
    }
  }
}
