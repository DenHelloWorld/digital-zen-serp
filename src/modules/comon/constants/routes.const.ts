export const ROUTES = Object.freeze({
  CURRENT_SITE: 'current-site-page',
  SOCIAL: 'social',
  SEO_AUDIT: 'seo-audit',
  HEADINGS: 'headings',
  PERFORMANCE: 'performance',
} as const);

/**
 * Type representing all available route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
