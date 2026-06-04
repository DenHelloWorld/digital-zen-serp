export type WebVitalsStrategy = 'mobile' | 'desktop';
export type WebVitalsSource = 'api' | 'local';
export type CruxCategory = 'FAST' | 'AVERAGE' | 'SLOW';

export interface CruxMetric {
  category: CruxCategory;
  percentile: number;
}

export interface WebVitalsCrux {
  fcp?: CruxMetric;
  lcp?: CruxMetric;
  cls?: CruxMetric;
  inp?: CruxMetric;
}

export interface FilmstripFrame {
  timestamp: number;
  data: string;
}

export interface LighthouseOpportunity {
  id: string;
  title: string;
  displayValue: string | null;
  score: number | null;
}

export interface LighthouseScores {
  performance: number | null;
  seo: number | null;
  bestPractices: number | null;
  accessibility: number | null;
}

export interface WebVitalsData {
  url: string;
  strategy: WebVitalsStrategy;
  source: WebVitalsSource;
  score: number | null;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
  inp: number | null;
  ttfb: number | null;
  tti: number | null;
  speedIndex: number | null;
  // Navigation Timing (local only)
  dnsLookup: number | null;
  tcpConnect: number | null;
  domInteractive: number | null;
  domContentLoaded: number | null;
  domComplete: number | null;
  crux: WebVitalsCrux | null;
  filmstrip: FilmstripFrame[] | null;
  lighthouseScores: LighthouseScores | null;
  opportunities: LighthouseOpportunity[] | null;
  errorCode?: string;
  timestamp: number;
}
