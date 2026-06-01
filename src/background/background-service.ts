/// <reference types="chrome"/>
import {
  CHROME_COMMAND_ENUM,
  CHROME_KEEPALIVE_PORT,
  ChromeCommandType,
} from '../shared/enums/chrome-command.enum';
import { FOCUS_ERROR_ENUM } from '../shared/enums/focus-error.enum';
import { parsePageHeadings } from '../shared/helpers/heading-parser.helper';
import { isHttpUrl } from '../shared/helpers/is-http-url.helper';
import {
  applyHeadingHighlights,
  scrollToHeading,
} from '../shared/helpers/page-heading-highlighter';
import type { HeadingData } from '../shared/models/heading-data.model';
import { GooglePreviewService } from './google-preview.service';
import { SeoAuditService } from './seo-audit.service';
import { WebVitalsService } from './web-vitals.service';

interface InjectionResult {
  html: string;
  url: string;
}

interface HandlerResult {
  success: boolean;
  data?: unknown;
  tab?: Record<string, unknown> | null;
  headingsFound?: number;
  error?: string;
}

type MessageHandler = (
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender
) => Promise<HandlerResult>;

export class BackgroundService {
  readonly #googlePreview = new GooglePreviewService();
  readonly #seoAudit = new SeoAuditService();
  readonly #webVitals = new WebVitalsService();
  readonly #keepalivePorts = new Set<chrome.runtime.Port>();
  readonly #highlightedTabs = new Set<number>();

  readonly #handlers = new Map<ChromeCommandType, MessageHandler>([
    [CHROME_COMMAND_ENUM.SCRAPE_CURRENT_TAB, () => this.#handleScrap()],
    [CHROME_COMMAND_ENUM.GET_ACTIVE_TAB, () => this.#handleGetActiveTab()],
    [CHROME_COMMAND_ENUM.BASE_SEO_AUDIT, () => this.#handleSeoAudit()],
    [CHROME_COMMAND_ENUM.HIGHLIGHT_HEADERS, msg => this.#handleHighlightHeaders(msg)],
    [CHROME_COMMAND_ENUM.PARSE_HEADINGS, () => this.#handleParseHeadings()],
    [CHROME_COMMAND_ENUM.SCROLL_TO_HEADING, msg => this.#handleScrollToHeading(msg)],
    [CHROME_COMMAND_ENUM.COLLECT_WEB_VITALS, () => this.#handleCollectWebVitals()],
  ]);

  constructor() {
    this.#initListeners();
  }

  #initListeners(): void {
    let operationQueue: Promise<void> = Promise.resolve();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const safeSendResponse = (response?: unknown) => {
        try {
          sendResponse(response);
        } catch {
          /* port may be closed */
        }
      };

      /* sidePanel.open() requires synchronous call (user gesture) */
      if (message.command === CHROME_COMMAND_ENUM.OPEN_SIDE_PANEL_APP) {
        const targetWindowId = message.windowId || sender.tab?.windowId;
        const options = targetWindowId
          ? { windowId: targetWindowId as number }
          : { windowId: chrome.windows.WINDOW_ID_CURRENT };
        chrome.sidePanel
          .open(options)
          .then(() => safeSendResponse({ success: true }))
          .catch(() => safeSendResponse({ success: false }));
        return true;
      }

      operationQueue = operationQueue.then(async () => {
        const handler = this.#handlers.get(message.command as ChromeCommandType);
        if (!handler) {
          console.warn('[BackgroundService]', 'Unknown command:', message.command);
          safeSendResponse({ success: false, error: FOCUS_ERROR_ENUM.GENERIC_ERROR });
          return;
        }
        try {
          const result = await handler(message, sender);
          safeSendResponse(result);
        } catch (err) {
          console.error('[BackgroundService]', `Handler error:`, err);
          safeSendResponse({ success: false, error: FOCUS_ERROR_ENUM.GENERIC_ERROR });
        }
      });

      return true;
    });

    chrome.runtime.onConnect.addListener(port => {
      if (port.name !== CHROME_KEEPALIVE_PORT) return;
      this.#keepalivePorts.add(port);
      port.onDisconnect.addListener(() => {
        this.#keepalivePorts.delete(port);
        if (this.#keepalivePorts.size === 0) {
          this.#cleanupHeadings();
        }
      });
    });

    chrome.runtime.onInstalled.addListener(() => {
      console.info('[BackgroundService]', 'App initialized via onInstalled');
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
        /* non-critical */
      });
    });
  }

  /* ── Command handlers ─────────────────────────────────────── */

  async #handleScrap(): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!isHttpUrl(tab.url)) return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({ html: document.documentElement.outerHTML, url: window.location.href }),
    });

    const result = results[0]?.result as InjectionResult | undefined;
    if (!result) return { success: false, error: 'INJECTION_FAILED' };

    const metadata = this.#googlePreview.extractMetadata(result.html, result.url);
    return { success: true, data: metadata };
  }

  async #handleGetActiveTab(): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    return {
      success: true,
      tab: tab ? { id: tab.id, url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl } : null,
    };
  }

  async #handleSeoAudit(): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!tab.url || !tab.id || !isHttpUrl(tab.url))
      return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    const auditData = await this.#seoAudit.audit(tab.url, tab.id);
    return { success: true, data: auditData };
  }

  async #handleHighlightHeaders(message: Record<string, unknown>): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!isHttpUrl(tab.url)) return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    const payload = message['payload'] as
      | { enabled: boolean; selectedTags: Record<string, boolean> }
      | undefined;
    if (!payload) return { success: false, error: 'INVALID_PAYLOAD' };
    const config = payload;

    if (config.enabled) {
      this.#highlightedTabs.add(tab.id);
    } else {
      this.#highlightedTabs.delete(tab.id);
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: applyHeadingHighlights,
        args: [config],
      });
      const result = results[0]?.result as { headingsFound: number } | undefined;
      return { success: true, headingsFound: result?.headingsFound ?? 0 };
    } catch {
      return { success: false, error: 'INJECTION_FAILED' };
    }
  }

  async #handleParseHeadings(): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id || !tab.url || !isHttpUrl(tab.url)) {
      return { success: false, error: 'INVALID_PAGE_PROTOCOL' };
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: parsePageHeadings,
      });
      const headings = results[0]?.result as HeadingData[] | undefined;
      return { success: true, data: headings ?? [] };
    } catch {
      return { success: false, error: 'INJECTION_FAILED' };
    }
  }

  async #handleScrollToHeading(message: Record<string, unknown>): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id) return { success: false, error: 'NO_ACTIVE_TAB' };

    const payload = message['payload'] as { id: number; tagName: string } | undefined;
    if (!payload || typeof payload.id !== 'number' || typeof payload.tagName !== 'string') {
      return { success: false, error: 'INVALID_PAYLOAD' };
    }

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrollToHeading,
        args: [payload.id, payload.tagName],
      });
      const result = results[0]?.result as { success: boolean } | undefined;
      return result ?? { success: false, error: 'INJECTION_FAILED' };
    } catch {
      return { success: false, error: 'INJECTION_FAILED' };
    }
  }

  async #handleCollectWebVitals(): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id || !tab.url) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!isHttpUrl(tab.url)) return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    try {
      const vitals = await this.#webVitals.collectAll(tab.id, tab.url);
      return { success: true, data: vitals };
    } catch {
      return { success: false, error: 'INJECTION_FAILED' };
    }
  }

  /* ── Helpers ──────────────────────────────────────────────── */

  async #requireActiveTab(): Promise<chrome.tabs.Tab | null> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] ?? null;
  }

  #cleanupHeadings(): void {
    if (this.#highlightedTabs.size === 0) return;
    for (const tabId of this.#highlightedTabs) {
      chrome.scripting
        .executeScript({
          target: { tabId },
          func: applyHeadingHighlights,
          args: [{ enabled: false, selectedTags: {} }],
        })
        .catch(() => {
          /* empty */
        });
    }
    this.#highlightedTabs.clear();
  }
}
