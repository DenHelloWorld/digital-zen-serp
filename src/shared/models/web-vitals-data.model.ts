export type WebVitalsStrategy = 'mobile' | 'desktop';
export type WebVitalsSource = 'api' | 'local';

export interface WebVitalsData {
  url: string;
  strategy: WebVitalsStrategy;
  source: WebVitalsSource;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
  speedIndex: number | null;
  errorCode?: string;
  timestamp: number;
}
