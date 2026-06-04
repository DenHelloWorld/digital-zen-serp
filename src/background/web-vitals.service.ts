/// <reference types="chrome"/>
import { isPageSpeedBlocked } from '../shared/helpers/is-pagespeed-blocked.helper';
import { isPrivateUrl } from '../shared/helpers/is-private-url.helper';
import { collectPageWebVitals } from '../shared/helpers/web-vitals-collector';
import {
  CruxCategory,
  CruxMetric,
  FilmstripFrame,
  LighthouseOpportunity,
  LighthouseScores,
  WebVitalsCrux,
  WebVitalsData,
  WebVitalsStrategy,
} from '../shared/models/web-vitals-data.model';
import { PAGESPEED_API_KEY } from './pagespeed-key.generated';

const PAGESPEED_API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

interface CruxRaw {
  percentile?: number;
  category?: string;
}

interface CruxExperience {
  metrics?: {
    FIRST_CONTENTFUL_PAINT_MS?: CruxRaw;
    LARGEST_CONTENTFUL_PAINT_MS?: CruxRaw;
    CUMULATIVE_LAYOUT_SHIFT_SCORE?: CruxRaw;
    INTERACTION_TO_NEXT_PAINT?: CruxRaw;
  };
}

type AuditRecord = Record<
  string,
  | {
      id?: string;
      title?: string;
      score?: number | null;
      displayValue?: string;
      numericValue?: number;
      details?: { items?: Array<{ timestamp?: number; data?: string }> };
    }
  | undefined
>;

interface PageSpeedInsight {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
      seo?: { score?: number };
      'best-practices'?: { score?: number };
      accessibility?: { score?: number };
    };
    audits?: AuditRecord;
  };
  loadingExperience?: CruxExperience;
  originLoadingExperience?: CruxExperience;
  error?: { code: number; message: string };
}

const OPPORTUNITY_IDS = [
  'render-blocking-resources',
  'unused-javascript',
  'unused-css-rules',
  'uses-optimized-images',
  'uses-next-gen-formats',
  'uses-text-compression',
  'uses-long-cache-ttl',
  'efficient-animated-content',
  'uses-responsive-images',
  'bootup-time',
  'mainthread-work-breakdown',
  'dom-size',
  'third-party-summary',
  'uses-rel-preconnect',
  'font-display',
] as const;

function parseCruxMetric(raw: CruxRaw | undefined): CruxMetric | undefined {
  if (!raw?.category) return undefined;
  const category = raw.category as CruxCategory;
  if (category !== 'FAST' && category !== 'AVERAGE' && category !== 'SLOW') return undefined;
  return { category, percentile: raw.percentile ?? 0 };
}

function parseCrux(exp: CruxExperience | undefined): WebVitalsCrux | null {
  if (!exp?.metrics) return null;
  const m = exp.metrics;
  const crux: WebVitalsCrux = {};
  const fcp = parseCruxMetric(m.FIRST_CONTENTFUL_PAINT_MS);
  const lcp = parseCruxMetric(m.LARGEST_CONTENTFUL_PAINT_MS);
  const cls = parseCruxMetric(m.CUMULATIVE_LAYOUT_SHIFT_SCORE);
  const inp = parseCruxMetric(m.INTERACTION_TO_NEXT_PAINT);
  if (fcp) crux.fcp = fcp;
  if (lcp) crux.lcp = lcp;
  if (cls) crux.cls = cls;
  if (inp) crux.inp = inp;
  return Object.keys(crux).length > 0 ? crux : null;
}

function parseFilmstrip(audits: AuditRecord | undefined): FilmstripFrame[] | null {
  const items = audits?.['screenshot-thumbnails']?.details?.items;
  if (!items?.length) return null;
  return items
    .filter(item => item.timestamp != null && item.data)
    .map(item => ({ timestamp: item.timestamp!, data: item.data! }));
}

function parseOpportunities(audits: AuditRecord | undefined): LighthouseOpportunity[] | null {
  if (!audits) return null;
  const result: LighthouseOpportunity[] = [];
  for (const id of OPPORTUNITY_IDS) {
    const audit = audits[id];
    if (!audit?.title) continue;
    // Skip audits that are not applicable (score === null means N/A)
    if (audit.score === null || audit.score === undefined) continue;
    // Only include failed/warning audits (score < 0.9)
    if (audit.score >= 0.9) continue;
    result.push({
      id,
      title: audit.title,
      displayValue: audit.displayValue ?? null,
      score: audit.score,
    });
  }
  return result.length > 0 ? result.sort((a, b) => (a.score ?? 1) - (b.score ?? 1)) : null;
}

const NULL_METRICS = {
  score: null,
  fcp: null,
  lcp: null,
  cls: null,
  tbt: null,
  inp: null,
  ttfb: null,
  tti: null,
  speedIndex: null,
  crux: null,
  filmstrip: null,
  lighthouseScores: null,
  opportunities: null,
  dnsLookup: null,
  tcpConnect: null,
  domInteractive: null,
  domContentLoaded: null,
  domComplete: null,
} as const;

export class WebVitalsService {
  async collectFromPage(tabId: number): Promise<ReturnType<typeof collectPageWebVitals>> {
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
    const categories = ['performance', 'seo', 'best-practices', 'accessibility']
      .map(c => `&category=${c}`)
      .join('');
    const apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(url)}&strategy=${strategy}${categories}${keyParam}`;
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

    if (isPageSpeedBlocked(url) || isPrivateUrl(url)) {
      const errorCode = isPageSpeedBlocked(url) ? 'BLOCKED_DOMAIN' : 'PRIVATE_URL';
      try {
        const v = await this.collectFromPage(tabId);
        return {
          ...base,
          ...NULL_METRICS,
          source: 'local',
          errorCode,
          fcp: v.fcp,
          lcp: v.lcp,
          cls: v.cls,
          tbt: v.tbt,
          ttfb: v.ttfb,
          dnsLookup: v.dnsLookup,
          tcpConnect: v.tcpConnect,
          domInteractive: v.domInteractive,
          domContentLoaded: v.domContentLoaded,
          domComplete: v.domComplete,
        };
      } catch {
        return { ...base, ...NULL_METRICS, source: 'local', errorCode: 'INJECTION_FAILED' };
      }
    }

    try {
      const { data, status } = await this.fetchAllFromApi(url, strategy);

      if (status === 429) {
        return { ...base, ...NULL_METRICS, source: 'api', errorCode: 'RATE_LIMIT' };
      }
      if (status !== 200 || data.error) {
        return { ...base, ...NULL_METRICS, source: 'api', errorCode: 'API_ERROR' };
      }

      const audits = data.lighthouseResult?.audits;
      const cats = data.lighthouseResult?.categories;

      // CrUX: page-level first, fall back to origin-level
      const crux = parseCrux(data.loadingExperience) ?? parseCrux(data.originLoadingExperience);

      const toScore = (v: number | undefined): number | null =>
        v != null ? Math.round(v * 100) : null;

      const lighthouseScores: LighthouseScores = {
        performance: toScore(cats?.performance?.score),
        seo: toScore(cats?.seo?.score),
        bestPractices: toScore(cats?.['best-practices']?.score),
        accessibility: toScore(cats?.accessibility?.score),
      };

      return {
        ...base,
        source: 'api',
        score: lighthouseScores.performance,
        fcp: audits?.['first-contentful-paint']?.numericValue ?? null,
        lcp: audits?.['largest-contentful-paint']?.numericValue ?? null,
        cls: audits?.['cumulative-layout-shift']?.numericValue ?? null,
        tbt: audits?.['total-blocking-time']?.numericValue ?? null,
        // INP is a field metric; fall back to CrUX p75 (page), then origin
        inp:
          audits?.['interaction-to-next-paint']?.numericValue ??
          data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile ??
          data.originLoadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile ??
          null,
        ttfb: audits?.['server-response-time']?.numericValue ?? null,
        tti: audits?.['interactive']?.numericValue ?? null,
        speedIndex: audits?.['speed-index']?.numericValue ?? null,
        crux,
        filmstrip: parseFilmstrip(audits),
        lighthouseScores,
        opportunities: parseOpportunities(audits),
        dnsLookup: null,
        tcpConnect: null,
        domInteractive: null,
        domContentLoaded: null,
        domComplete: null,
      };
    } catch {
      return { ...base, ...NULL_METRICS, source: 'api', errorCode: 'API_UNAVAILABLE' };
    }
  }
}
