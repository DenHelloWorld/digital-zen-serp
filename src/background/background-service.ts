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
import { ContentAnalysisService } from './content-analysis.service';
import { GooglePreviewService } from './google-preview.service';
import { SchemaOgService } from './schema-og.service';
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
  readonly #contentAnalysis = new ContentAnalysisService();
  readonly #googlePreview = new GooglePreviewService();
  readonly #schemaOg = new SchemaOgService();
  readonly #seoAudit = new SeoAuditService();
  readonly #webVitals = new WebVitalsService();
  readonly #keepalivePorts = new Set<chrome.runtime.Port>();
  readonly #highlightedTabs = new Set<number>();
  readonly #injectedTabs = new Set<number>();

  readonly #handlers = new Map<ChromeCommandType, MessageHandler>([
    [CHROME_COMMAND_ENUM.SCRAPE_CURRENT_TAB, () => this.#handleScrap()],
    [CHROME_COMMAND_ENUM.GET_ACTIVE_TAB, () => this.#handleGetActiveTab()],
    [CHROME_COMMAND_ENUM.BASE_SEO_AUDIT, () => this.#handleSeoAudit()],
    [CHROME_COMMAND_ENUM.HIGHLIGHT_HEADERS, msg => this.#handleHighlightHeaders(msg)],
    [CHROME_COMMAND_ENUM.PARSE_HEADINGS, () => this.#handleParseHeadings()],
    [CHROME_COMMAND_ENUM.SCROLL_TO_HEADING, msg => this.#handleScrollToHeading(msg)],
    [CHROME_COMMAND_ENUM.COLLECT_WEB_VITALS, msg => this.#handleCollectWebVitals(msg)],
    [CHROME_COMMAND_ENUM.COLLECT_WEB_VITALS_BOTH, () => this.#handleCollectWebVitalsBoth()],
    [CHROME_COMMAND_ENUM.COLLECT_SCHEMA_OG, () => this.#handleCollectSchemaOg()],
    [CHROME_COMMAND_ENUM.ANALYZE_CONTENT, msg => this.#handleAnalyzeContent(msg)],
  ]);

  constructor() {
    this.#initListeners();
  }

  #initListeners(): void {
    chrome.action.onClicked.addListener(tab => {
      if (!tab.id) return;
      const tabId = tab.id;
      const inject = this.#injectedTabs.has(tabId)
        ? Promise.resolve()
        : chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).then(() => {
            this.#injectedTabs.add(tabId);
          });

      inject
        .then(() => chrome.tabs.sendMessage(tabId, { command: 'TOGGLE_PANEL' }))
        .catch(err => console.warn('[BackgroundService] toggle panel failed:', err));
    });

    chrome.tabs.onRemoved.addListener(tabId => {
      this.#injectedTabs.delete(tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.status === 'loading') {
        this.#injectedTabs.delete(tabId);
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const safeSendResponse = (response?: unknown) => {
        try {
          sendResponse(response);
        } catch {
          /* port may be closed */
        }
      };

      const handler = this.#handlers.get(message.command as ChromeCommandType);
      if (!handler) {
        console.warn('[BackgroundService]', 'Unknown command:', message.command);
        safeSendResponse({ success: false, error: FOCUS_ERROR_ENUM.GENERIC_ERROR });
        return true;
      }

      handler(message, sender)
        .then(result => safeSendResponse(result))
        .catch(err => {
          console.error('[BackgroundService]', `Handler error:`, err);
          safeSendResponse({ success: false, error: FOCUS_ERROR_ENUM.GENERIC_ERROR });
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
    });

    this.#setEmojiIcon();
  }

  #setEmojiIcon(): void {
    try {
      const size = 128;
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${size * 0.78}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔍', size / 2, size / 2 + 6);
      chrome.action.setIcon({ imageData: ctx.getImageData(0, 0, size, size) });
    } catch {
      /* fallback to browser default */
    }
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

  async #handleCollectWebVitals(msg: Record<string, unknown>): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id || !tab.url) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!isHttpUrl(tab.url)) return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    const strategy = msg['strategy'] === 'desktop' ? 'desktop' : 'mobile';
    const vitals = await this.#webVitals.collectAll(tab.id, tab.url, strategy);
    return { success: true, data: vitals };
  }

  async #handleCollectWebVitalsBoth(): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id || !tab.url) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!isHttpUrl(tab.url)) return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    const mobile = await this.#webVitals.collectAll(tab.id, tab.url, 'mobile');
    const desktop = await this.#webVitals.collectAll(tab.id, tab.url, 'desktop');
    return { success: true, data: { mobile, desktop } };
  }

  async #handleCollectSchemaOg(): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id || !tab.url) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!isHttpUrl(tab.url)) return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    const data = await this.#schemaOg.collect(tab.id, tab.url);
    return { success: true, data };
  }

  async #handleAnalyzeContent(message: Record<string, unknown>): Promise<HandlerResult> {
    const tab = await this.#requireActiveTab();
    if (!tab?.id || !tab.url) return { success: false, error: 'NO_ACTIVE_TAB' };
    if (!isHttpUrl(tab.url)) return { success: false, error: 'INVALID_PAGE_PROTOCOL' };

    const mode = message['mode'] === 'main' ? 'main' : 'full';
    const data = await this.#contentAnalysis.analyze(tab.id, mode);
    return { success: true, data };
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
