export const ROUTES = Object.freeze({
  CURRENT_SITE: 'current-site-page',
  OG: 'og',
  SCHEMA: 'schema',
  SEO_AUDIT: 'seo-audit',
  HEADINGS: 'headings',
  PERFORMANCE: 'performance',
  CONTENT: 'content',
} as const);

/**
 * Type representing all available route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
