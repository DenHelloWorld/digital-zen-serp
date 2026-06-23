export type MetaTagGroup = 'og' | 'twitter' | 'facebook' | 'article' | 'basic';
export type MetaTagStatus = 'ok' | 'warning' | 'missing' | 'invalid';
export type OgBlockStatus = 'ready' | 'needs-improvement' | 'broken';

export interface ValidationMessage {
  key: string;
  params?: Record<string, unknown>;
}

export interface MetaTag {
  key: string;
  value: string | null;
  group: MetaTagGroup;
  status: MetaTagStatus;
  statusMessage?: ValidationMessage;
}

export interface ImageCheckResult {
  url: string;
  naturalWidth: number;
  naturalHeight: number;
  fileSizeBytes: number | null;
  loadStatus: 'ok' | 'error' | 'timeout' | 'size-unknown';
}

export interface SchemaOgData {
  schemaBlocks: import('./schema-data.model').SchemaBlock[];
  metaTags: MetaTag[];
  pageUrl: string;
}
