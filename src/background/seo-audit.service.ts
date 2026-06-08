/// <reference types="chrome"/>
import { SeoAuditData } from '../shared/models/seo-audit-data.model';

/**
 * Injected into the page — extracts SEO metadata directly from the DOM
 * without serialising the entire HTML.
 */
function extractPageMeta(): Omit<
  SeoAuditData,
  'url' | 'status' | 'xRobotsTag' | 'robotsTxtStatus'
> {
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

  /* ── Robots meta ───────────────────────────────── */
  const robotsMeta = getMeta(['meta[name="robots"]']);

  /* ── Canonical ─────────────────────────────────── */
  const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const canonical = canonicalEl?.getAttribute('href')?.trim() || null;

  /* ── Hreflang ──────────────────────────────────── */
  const hreflangEls = document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]');
  const hreflang =
    hreflangEls.length > 0
      ? Array.from(hreflangEls)
          .map(el => el.getAttribute('hreflang') ?? '')
          .filter(Boolean)
      : null;

  return { lang, published, updated, robotsMeta, canonical, hreflang };
}

interface FetchResult {
  status: number;
  xRobotsTag: string | null;
  robotsTxtStatus: number | null;
}

export class SeoAuditService {
  async audit(url: string, tabId: number): Promise<SeoAuditData> {
    const [results] = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageMeta,
    });

    const meta = results.result as
      | Omit<SeoAuditData, 'url' | 'status' | 'xRobotsTag' | 'robotsTxtStatus'>
      | undefined;
    if (!meta) throw new Error('INJECTION_FAILED');

    const { status, xRobotsTag, robotsTxtStatus } = await this.#fetchMeta(url);

    return { url, status, xRobotsTag, robotsTxtStatus, ...meta };
  }

  async #fetchMeta(url: string): Promise<FetchResult> {
    let status = 0;
    let xRobotsTag: string | null = null;
    let robotsTxtStatus: number | null = null;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      status = response.status;
      xRobotsTag = response.headers.get('x-robots-tag');
    } catch {
      /* ignore */
    }

    try {
      const origin = new URL(url).origin;
      const r = await fetch(`${origin}/robots.txt`, { method: 'GET' });
      robotsTxtStatus = r.status;
      await r.body?.cancel();
    } catch {
      robotsTxtStatus = 0;
    }

    return { status, xRobotsTag, robotsTxtStatus };
  }
}
