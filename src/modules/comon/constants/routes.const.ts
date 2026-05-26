export const ROUTES = Object.freeze({
  GOOGLE_SERP: 'google-serp',
  CURRENT_SITE: 'current-site',
  SOCIAL: 'social',
  SEO_AUDIT: 'seoAudit',
} as const);

/**
 * Type representing all available route paths
 */
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
