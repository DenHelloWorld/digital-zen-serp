import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { CHROME_COMMAND_ENUM } from '../enums/chrome-command.enum';
import { logger } from '../helpers/logger';
import { ScrapedData } from '../models/scrapped-data.model';
import { effect, inject } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface ScrapState {
  activeTab: chrome.tabs.Tab | null;
  currentTabScrap: ScrapedData | null;
  isTabLoading: boolean;
  isScrapLoading: boolean;
  tabError: string | null;
  scrapError: string | null;
}

const initialState: ScrapState = {
  activeTab: null,
  currentTabScrap: null,
  isTabLoading: false,
  isScrapLoading: false,
  tabError: null,
  scrapError: null,
};

export const ScrapStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(store => {
    const isChrome = inject(IS_CHROME_EXTENSION);
    const scrapStoreLogger = logger.createLogger('[ScrapStore]');

    effect(() => {
      scrapStoreLogger.info(getState(store));
    });

    return {
      async scrapCurrentTab(): Promise<void> {
        patchState(store, { isScrapLoading: true, scrapError: null });

        if (!isChrome) {
          patchState(store, {
            isScrapLoading: false,
            scrapError: 'CHROME_RUNTIME_NOT_FOUND',
          });
          return;
        }

        try {
          const response = await chrome.runtime.sendMessage({
            command: CHROME_COMMAND_ENUM.SCRAP_CURRENT_TAB,
          });

          if (response?.success) {
            patchState(store, {
              currentTabScrap: response.data,
              isScrapLoading: false,
            });
          } else {
            patchState(store, {
              isScrapLoading: false,
              scrapError: response?.error || 'UNKNOWN_ERROR',
            });
          }
        } catch (err) {
          patchState(store, {
            isScrapLoading: false,
            scrapError: 'MESSAGE_SENDING_FAILED',
          });
          scrapStoreLogger.error(err);
        }
      },

      async getActiveTab() {
        patchState(store, { isTabLoading: true, tabError: null });

        if (!isChrome) {
          patchState(store, {
            isTabLoading: false,
            tabError: 'CHROME_RUNTIME_NOT_FOUND',
          });
          return;
        }

        try {
          const response = await chrome.runtime.sendMessage({
            command: CHROME_COMMAND_ENUM.GET_ACTIVE_TAB,
          });

          if (response?.success) {
            patchState(store, {
              activeTab: response.tab,
              isTabLoading: false,
            });
          } else {
            patchState(store, {
              isTabLoading: false,
              tabError: response?.error || 'UNKNOWN_ERROR',
            });
          }
        } catch (err) {
          patchState(store, {
            isTabLoading: false,
            tabError: 'MESSAGE_SENDING_FAILED',
          });
          scrapStoreLogger.error(err);
        }
      },

      /**
       * Listen to Chrome tab changes (activation and URL updates)
       * to keep #activeTab signal in sync.
       */
      async listenToTabChanges() {
        if (!isChrome) {
          return;
        }

        chrome.tabs.onActivated.addListener(() => {
          this.getActiveTab();
          this.scrapCurrentTab();
        });

        chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
          if (changeInfo.status === 'complete' && tab.active) {
            this.getActiveTab();
            this.scrapCurrentTab();
          }
        });
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),

  withHooks({
    onInit(store) {
      store.listenToTabChanges();
    },
  })
);
