/// <reference types="chrome"/>
import { collectPageWebVitals } from '../shared/helpers/web-vitals-collector';
import { WebVitalsData } from '../shared/models/web-vitals-data.model';

const PAGESPEED_API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface PageSpeedInsight {
  lighthouseResult?: {
    audits?: {
      'first-contentful-paint'?: { numericValue?: number };
      'largest-contentful-paint'?: { numericValue?: number };
      'cumulative-layout-shift'?: { numericValue?: number };
      'total-blocking-time'?: { numericValue?: number };
      'speed-index'?: { numericValue?: number };
    };
  };
}

export class WebVitalsService {
  /**
   * Inject web vitals collector into the page and wait for results.
   */
  async collectFromPage(tabId: number): Promise<{
    fcp: number | null;
    lcp: number | null;
    cls: number | null;
    tbt: number | null;
  }> {
    const [results] = await chrome.scripting.executeScript({
      target: { tabId },
      func: collectPageWebVitals,
    });

    const vitals = results.result as Awaited<ReturnType<typeof collectPageWebVitals>> | undefined;
    if (!vitals) throw new Error('INJECTION_FAILED');

    return vitals;
  }

  /**
   * Fetch Speed Index from PageSpeed Insights API with retry.
   */
  async fetchSpeedIndex(url: string): Promise<number | null> {
    try {
      const apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(url)}&strategy=mobile`;
      const response = await fetch(apiUrl);
      if (!response.ok) return null;
      const data = (await response.json()) as PageSpeedInsight;
      return data?.lighthouseResult?.audits?.['speed-index']?.numericValue ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch Speed Index with retry (up to 3 attempts, increasing delay).
   */
  async fetchSpeedIndexWithRetry(url: string): Promise<number | null> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await this.fetchSpeedIndex(url);
      if (result !== null) return result;
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
      }
    }
    return null;
  }

  /**
   * Collect page vitals. Speed Index is attempted once (may be null due to API limits).
   */
  async collectAll(tabId: number, url: string): Promise<WebVitalsData> {
    const pageVitals = await this.collectFromPage(tabId);
    const speedIndex = await this.fetchSpeedIndex(url);

    return {
      url,
      fcp: pageVitals.fcp,
      lcp: pageVitals.lcp,
      cls: pageVitals.cls,
      tbt: pageVitals.tbt,
      speedIndex,
      timestamp: Date.now(),
    };
  }
}
