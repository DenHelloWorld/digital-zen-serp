export type SeoAuditStatus = 'ok' | 'missing' | 'bad';

export interface SeoAuditData {
  url: string;
  status: number;
  lang: string | null;
  published: string | null;
  updated: string | null;
  // Indexability
  robotsMeta: string | null;
  xRobotsTag: string | null;
  canonical: string | null;
  hreflang: string[] | null;
  robotsTxtStatus: number | null;
}
