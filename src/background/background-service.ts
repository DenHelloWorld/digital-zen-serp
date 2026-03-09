/// <reference types="chrome"/>
import { CHROME_COMMAND_ENUM, ChromeCommandType } from '../modules/comon/enums/chrome-command.enum';
import { FOCUS_ERROR_ENUM } from '../modules/comon/enums/focus-error.enum';
import { isHttpUrl } from '../modules/comon/helpers/is-http-url.helper';
import { logger } from '../modules/comon/helpers/logger';
import { ScraperService } from './scrapper-service';

/**
 * @class BackgroundService
 * @description The main service class that manages the extension's background tasks and data persistence.
 */
export class BackgroundService {
  readonly #logger = logger.createLogger('BackgroundService');
  readonly #scraper = new ScraperService();

  constructor() {
    this.initializeListeners();
  }

  /**
   *  Initialization of messages and events
   *  */
  private initializeListeners(): void {
    let operationQueue: Promise<void> = Promise.resolve();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const safeSendResponse = (response?: unknown) => {
        try {
          sendResponse(response);
        } catch (sendError) {
          this.#logger.error('sendResponse failed:', sendError);
        }
      };
      /**
       * sidePanel.open() requires a direct user gesture to function.
       * It must be called SYNCHRONOUSLY (outside the promise queue),
       * otherwise Chrome will treat the user gesture as expired.
       */
      if (message.command === CHROME_COMMAND_ENUM.OPEN_SIDE_PANEL_APP) {
        const targetWindowId = message.windowId || sender.tab?.windowId;
        const options = targetWindowId
          ? { windowId: targetWindowId }
          : { windowId: chrome.windows.WINDOW_ID_CURRENT };

        chrome.sidePanel
          .open(options)
          .then(() => safeSendResponse({ success: true }))
          .catch(err => {
            this.#logger.error('SidePanel gesture error:', err);
            safeSendResponse({ success: false });
          });
        return true;
      }

      operationQueue = operationQueue.then(async () => {
        try {
          switch (message.command as ChromeCommandType) {
            case CHROME_COMMAND_ENUM.SCRAP_CURRENT_TAB: {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

              if (!tab?.id || !isHttpUrl(tab.url)) {
                this.#logger.warn('Scraping skipped: Invalid or restricted URL', tab?.url);
                safeSendResponse({
                  success: false,
                  error: 'INVALID_PAGE_PROTOCOL',
                });
                break;
              }

              interface InjectionResult {
                html: string;
                url: string;
              }

              const injectionResults = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  return {
                    html: document.documentElement.outerHTML,
                    url: window.location.href,
                  };
                },
              });

              const result = injectionResults[0]?.result as InjectionResult | undefined;

              if (!result) {
                this.#logger.error('Failed to get result from injected script');
                safeSendResponse({ success: false, error: 'INJECTION_FAILED' });
                return;
              }

              const { html, url } = result;

              const metadata = this.#scraper.extractMetadata(html, url);

              safeSendResponse({ success: true, data: metadata });
              break;
            }
            case CHROME_COMMAND_ENUM.GET_ACTIVE_TAB: {
              const tab = await this.getActiveTab();

              safeSendResponse({
                success: true,
                tab: tab
                  ? {
                      id: tab.id,
                      url: tab.url,
                      title: tab.title,
                      favIconUrl: tab.favIconUrl,
                    }
                  : null,
              });
              break;
            }
            default: {
              this.#logger.warn('Unknown command received:', message.command);
              safeSendResponse({
                success: false,
                error: FOCUS_ERROR_ENUM.GENERIC_ERROR,
              });
            }
          }
        } catch (error) {
          this.#logger.error(`Error handling message ${message.command}:`, error);
          safeSendResponse({ success: false, error: FOCUS_ERROR_ENUM.GENERIC_ERROR });
        }
      });

      return true;
    });

    chrome.runtime.onInstalled.addListener(() => {
      this.#logger.info('App initialized via onInstalled');

      chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch(error => this.#logger.error('Error setting panel behavior:', error));
    });
  }

  private async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    return tabs.length ? tabs[0] : null;
  }
}
