/// <reference types="chrome"/>
import { SeoAuditData } from '../shared/models/seo-audit-data.model';

/**
 * Injected into the page — extracts SEO metadata directly from the DOM
 * without serialising the entire HTML.
 */
function extractPageMeta(): Omit<SeoAuditData, 'url' | 'status'> {
  const getMeta = (selectors: string[]): string | null => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute('content') || el.textContent || '';
        if (val.trim()) return val.trim();
      }
    }
    return null;
  };

  const formatDate = (value: string | null): string | null => {
    if (!value) return null;
    const d = new Date(value.trim());
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  };

  /* ── Lang ─────────────────────────────────────── */
  const lang =
    document.documentElement.getAttribute('lang') ||
    getMeta(['meta[http-equiv="content-language"]', 'meta[property="og:locale"]']);

  /* ── LD+JSON ──────────────────────────────────── */
  let ldPublished: string | undefined;
  let ldModified: string | undefined;
  try {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (script?.textContent) {
      const parsed = JSON.parse(script.textContent);
      const data = parsed['@graph']
        ? parsed['@graph'][0]
        : Array.isArray(parsed)
          ? parsed[0]
          : parsed;
      ldPublished = data?.datePublished;
      ldModified = data?.dateModified;
    }
  } catch {
    /* ignore */
  }

  /* ── Published ─────────────────────────────────── */
  const published = formatDate(
    getMeta([
      'meta[property="article:published_time"]',
      'meta[name="article:published_time"]',
      'meta[property="og:published_time"]',
      'meta[itemprop="datePublished"]',
      'meta[name="date"]',
    ]) ||
      document.querySelector('[itemprop="datePublished"]:not(time)')?.getAttribute('content') ||
      document.querySelector('[itemprop="datePublished"]')?.textContent ||
      document.querySelector('time[itemprop="datePublished"]')?.getAttribute('datetime') ||
      document.querySelector('time[pubdate]')?.getAttribute('datetime') ||
      document.querySelector('time[datetime]')?.getAttribute('datetime') ||
      ldPublished ||
      null
  );

  /* ── Updated ───────────────────────────────────── */
  const updated = formatDate(
    getMeta([
      'meta[property="article:modified_time"]',
      'meta[name="article:modified_time"]',
      'meta[property="og:modified_time"]',
      'meta[itemprop="dateModified"]',
    ]) ||
      document.querySelector('[itemprop="dateModified"]:not(time)')?.getAttribute('content') ||
      document.querySelector('[itemprop="dateModified"]')?.textContent ||
      document.querySelector('time[itemprop="dateModified"]')?.getAttribute('datetime') ||
      ldModified ||
      null
  );

  return { lang, published, updated };
}

export class SeoAuditService {
  async audit(url: string, tabId: number): Promise<SeoAuditData> {
    const [results] = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageMeta,
    });

    const meta = results.result as Omit<SeoAuditData, 'url' | 'status'> | undefined;
    if (!meta) throw new Error('INJECTION_FAILED');

    const status = await this.#fetchStatus(url);

    return { url, status, ...meta };
  }

  async #fetchStatus(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.status;
    } catch {
      return 0;
    }
  }
}
