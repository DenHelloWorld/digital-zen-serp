export interface WebVitalsData {
  url: string;
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tbt: number | null;
  speedIndex: number | null;
  timestamp: number;
}
