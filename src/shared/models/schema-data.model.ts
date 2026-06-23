export type SchemaFormat = 'json-ld' | 'microdata' | 'rdfa';
export type SchemaPropertyStatus = 'ok' | 'warning' | 'missing' | 'invalid';
export type SchemaBlockStatus = 'valid' | 'has-warnings' | 'has-errors' | 'broken';

export interface SchemaPropertyRow {
  property: string;
  value: string | null;
  status: SchemaPropertyStatus;
  message?: import('./og-data.model').ValidationMessage;
}

export interface SchemaBlock {
  format: SchemaFormat;
  type: string;
  properties: Record<string, unknown>;
  raw: string;
  sourceIndex: number;
  rows: SchemaPropertyRow[];
  overallStatus: SchemaBlockStatus;
}
