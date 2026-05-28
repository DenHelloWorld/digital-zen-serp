/**
 * All heading tag names.
 */
export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * Maps each heading tag to its highlight colour.
 */
export const TAG_COLORS: Record<string, string> = {
  h1: '#ef4444',
  h2: '#3b82f6',
  h3: '#22c55e',
  h4: '#f97316',
  h5: '#a855f7',
  h6: '#6b7280',
};

/**
 * Indicator dot colours for each feature status.
 * Keys match HighlighterStatus ('idle' | 'ok' | 'warning' | 'error').
 */
export const HIGHLIGHTER_STATUS_CONFIG = {
  idle: { dot: undefined, ping: undefined },
  ok: { dot: '#22c55e', ping: '#4ade80' },
  warning: { dot: '#eab308', ping: '#facc15' },
  error: { dot: '#ef4444', ping: '#f87171' },
} as const;

export type { HeadingHighlighterConfig } from './page-heading-highlighter';
