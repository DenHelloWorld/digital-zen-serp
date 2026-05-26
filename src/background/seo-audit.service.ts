/// <reference types="chrome"/>
import { SeoAuditData } from '../modules/comon/models/seo-audit-data.model';
import { parseHTML } from 'linkedom';

interface JsonLdData {
  datePublished?: string;
  dateModified?: string;
}

export class SeoAuditService {
  async audit(url: string, tabId: number): Promise<SeoAuditData> {
    // Получаем HTML из контекста вкладки (с куками, JS, авторизацией)
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.documentElement.outerHTML,
    });

    const html = results[0]?.result as string | undefined;

    if (!html) {
      throw new Error('INJECTION_FAILED');
    }

    // Пытаемся получить реальный HTTP-статус через HEAD-запрос
    const status = await this.#fetchStatus(url);

    const { document: doc } = parseHTML(html);

    const lang = this.#extractLang(doc);
    const linkedData = this.#getJsonLd(doc);
    const published = this.#extractPublished(doc, linkedData);
    const updated = this.#extractUpdated(doc, linkedData);

    return {
      url,
      status,
      lang,
      published,
      updated,
    };
  }

  async #fetchStatus(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.status;
    } catch {
      // HEAD-запрос может не сработать (CORS, сетевые ошибки и т.д.)
      return 0;
    }
  }

  #extractLang(doc: Document): string | null {
    const htmlLang = doc.querySelector('html')?.getAttribute('lang');
    if (htmlLang) return htmlLang;

    const metaLang =
      doc.querySelector('meta[http-equiv="content-language"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:locale"]')?.getAttribute('content');
    if (metaLang) return metaLang;

    return null;
  }

  #extractPublished(doc: Document, linkedData: JsonLdData): string | null {
    const value =
      doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="article:published_time"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:published_time"]')?.getAttribute('content') ||
      doc.querySelector('meta[itemprop="datePublished"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="date"]')?.getAttribute('content') ||
      doc.querySelector('[itemprop="datePublished"]:not(time)')?.getAttribute('content') ||
      doc.querySelector('[itemprop="datePublished"]')?.textContent ||
      doc.querySelector('time[itemprop="datePublished"]')?.getAttribute('datetime') ||
      doc.querySelector('time[pubdate]')?.getAttribute('datetime') ||
      doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
      linkedData.datePublished ||
      null;
    return this.#formatDate(value);
  }

  #extractUpdated(doc: Document, linkedData: JsonLdData): string | null {
    const value =
      doc.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="article:modified_time"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:modified_time"]')?.getAttribute('content') ||
      doc.querySelector('meta[itemprop="dateModified"]')?.getAttribute('content') ||
      doc.querySelector('[itemprop="dateModified"]:not(time)')?.getAttribute('content') ||
      doc.querySelector('[itemprop="dateModified"]')?.textContent ||
      doc.querySelector('time[itemprop="dateModified"]')?.getAttribute('datetime') ||
      linkedData.dateModified ||
      null;
    return this.#formatDate(value);
  }

  #formatDate(value: string | null | undefined): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return trimmed;
  }

  #getJsonLd(doc: Document): JsonLdData {
    try {
      const script = doc.querySelector('script[type="application/ld+json"]');
      if (!script?.textContent) return {};
      const parsed = JSON.parse(script.textContent);
      const data = parsed['@graph']
        ? parsed['@graph'][0]
        : Array.isArray(parsed)
          ? parsed[0]
          : parsed;
      return data || {};
    } catch {
      return {};
    }
  }
}
