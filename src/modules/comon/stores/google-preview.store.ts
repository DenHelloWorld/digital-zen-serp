import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { CHROME_COMMAND_ENUM } from '../enums/chrome-command.enum';
import { GooglePreviewData } from '../models/google-preview-data.model';
import { effect, inject } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface GooglePreviewState {
  activeTab: chrome.tabs.Tab | null;
  currentTabPreview: GooglePreviewData | null;
  isTabLoading: boolean;
  isPreviewLoading: boolean;
  tabError: string | null;
  previewError: string | null;
}

const initialState: GooglePreviewState = {
  activeTab: null,
  currentTabPreview: null,
  isTabLoading: false,
  isPreviewLoading: false,
  tabError: null,
  previewError: null,
};

export const GooglePreviewStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(store => {
    const isChrome = inject(IS_CHROME_EXTENSION);

    effect(() => {
      console.info('[GooglePreviewStore]', getState(store));
    });

    return {
      async loadPreview(): Promise<void> {
        patchState(store, { isPreviewLoading: true, previewError: null });

        if (!isChrome) {
          patchState(store, {
            isPreviewLoading: false,
            previewError: 'CHROME_RUNTIME_NOT_FOUND',
          });
          return;
        }

        try {
          const response = await chrome.runtime.sendMessage({
            command: CHROME_COMMAND_ENUM.SCRAP_CURRENT_TAB,
          });

          if (response?.success) {
            patchState(store, {
              currentTabPreview: response.data,
              isPreviewLoading: false,
            });
          } else {
            patchState(store, {
              isPreviewLoading: false,
              previewError: response?.error || 'UNKNOWN_ERROR',
            });
          }
        } catch (err) {
          patchState(store, {
            isPreviewLoading: false,
            previewError: 'MESSAGE_SENDING_FAILED',
          });
          console.error('[GooglePreviewStore]', err);
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
          console.error('[GooglePreviewStore]', err);
        }
      },

      async listenToTabChanges() {
        if (!isChrome) {
          return;
        }

        chrome.tabs.onActivated.addListener(() => {
          this.getActiveTab();
          this.loadPreview();
        });

        chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
          if (changeInfo.status === 'complete' && tab.active) {
            this.getActiveTab();
            this.loadPreview();
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
