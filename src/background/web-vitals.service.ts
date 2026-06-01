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
   * Fetch Speed Index from PageSpeed Insights API.
   * Returns null when the URL is not publicly accessible or the API call fails.
   */
  async fetchSpeedIndex(url: string): Promise<number | null> {
    try {
      const apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(url)}&strategy=mobile`;
      console.log('[WebVitalsService] Fetching Speed Index:', apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn(
          '[WebVitalsService] PageSpeed API error:',
          response.status,
          response.statusText
        );
        return null;
      }

      const data = (await response.json()) as PageSpeedInsight;
      const speedIndex = data?.lighthouseResult?.audits?.['speed-index']?.numericValue ?? null;
      console.log('[WebVitalsService] Speed Index result:', speedIndex);
      return speedIndex;
    } catch (err) {
      console.error('[WebVitalsService] PageSpeed API fetch failed:', err);
      return null;
    }
  }

  /**
   * Collect all web vitals: page metrics + Speed Index from API.
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
