/// <reference types="chrome"/>
import { isPrivateUrl } from '../shared/helpers/is-private-url.helper';
import { collectPageWebVitals } from '../shared/helpers/web-vitals-collector';
import { WebVitalsData, WebVitalsStrategy } from '../shared/models/web-vitals-data.model';
import { PAGESPEED_API_KEY } from './pagespeed-key.generated';

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
  error?: { code: number; message: string };
}

export class WebVitalsService {
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

  async fetchAllFromApi(
    url: string,
    strategy: WebVitalsStrategy
  ): Promise<{ data: PageSpeedInsight; status: number }> {
    const key = PAGESPEED_API_KEY || '';
    const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
    const apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}${keyParam}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(apiUrl, { signal: controller.signal });
      const data = (await response.json()) as PageSpeedInsight;
      return { data, status: response.status };
    } finally {
      clearTimeout(timeout);
    }
  }

  async collectAll(
    tabId: number,
    url: string,
    strategy: WebVitalsStrategy
  ): Promise<WebVitalsData> {
    const base = { url, strategy, timestamp: Date.now() };

    // Private URLs — fallback to PerformanceObserver immediately
    if (isPrivateUrl(url)) {
      try {
        const pageVitals = await this.collectFromPage(tabId);
        return {
          ...base,
          source: 'local',
          errorCode: 'PRIVATE_URL',
          fcp: pageVitals.fcp,
          lcp: pageVitals.lcp,
          cls: pageVitals.cls,
          tbt: pageVitals.tbt,
          speedIndex: null,
        };
      } catch {
        return {
          ...base,
          source: 'local',
          errorCode: 'INJECTION_FAILED',
          fcp: null,
          lcp: null,
          cls: null,
          tbt: null,
          speedIndex: null,
        };
      }
    }

    // Public URL — single PageSpeed API call for all metrics
    try {
      const { data, status } = await this.fetchAllFromApi(url, strategy);

      if (status === 429) {
        return {
          ...base,
          source: 'api',
          errorCode: 'RATE_LIMIT',
          fcp: null,
          lcp: null,
          cls: null,
          tbt: null,
          speedIndex: null,
        };
      }

      if (status !== 200 || data.error) {
        return {
          ...base,
          source: 'api',
          errorCode: 'API_ERROR',
          fcp: null,
          lcp: null,
          cls: null,
          tbt: null,
          speedIndex: null,
        };
      }

      const audits = data.lighthouseResult?.audits;
      return {
        ...base,
        source: 'api',
        fcp: audits?.['first-contentful-paint']?.numericValue ?? null,
        lcp: audits?.['largest-contentful-paint']?.numericValue ?? null,
        cls: audits?.['cumulative-layout-shift']?.numericValue ?? null,
        tbt: audits?.['total-blocking-time']?.numericValue ?? null,
        speedIndex: audits?.['speed-index']?.numericValue ?? null,
      };
    } catch {
      return {
        ...base,
        source: 'api',
        errorCode: 'API_UNAVAILABLE',
        fcp: null,
        lcp: null,
        cls: null,
        tbt: null,
        speedIndex: null,
      };
    }
  }
}
