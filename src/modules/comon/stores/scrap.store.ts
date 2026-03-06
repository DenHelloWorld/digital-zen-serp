import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { CHROME_COMMAND_ENUM } from '../enums/chrome-command.enum';
import { logger } from '../helpers/logger';
import { ScrapedData } from '../models/scrapped-data.model';
import { effect, inject } from '@angular/core';
import { getState, patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export interface ScrapState {
  currentTabScrap: ScrapedData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ScrapState = {
  currentTabScrap: null,
  isLoading: false,
  error: null,
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
        patchState(store, { isLoading: true, error: null });

        if (!isChrome) {
          patchState(store, {
            isLoading: false,
            error: 'CHROME_RUNTIME_NOT_FOUND',
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
              isLoading: false,
            });
          } else {
            patchState(store, {
              isLoading: false,
              error: response?.error || 'UNKNOWN_ERROR',
            });
          }
        } catch (err) {
          patchState(store, {
            isLoading: false,
            error: 'MESSAGE_SENDING_FAILED',
          });
          scrapStoreLogger.error(err);
        }
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  })
);
