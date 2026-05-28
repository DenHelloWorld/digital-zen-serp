export const ROUTES = Object.freeze({
  CURRENT_SITE: 'current-site',
  SOCIAL: 'social',
  SEO_AUDIT: 'seo-audit',
  HEADINGS: 'headings',
} as const);

/**
 * Type representing all available route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
