/**
 * Icon identifiers used throughout the application.
 * All icons are defined as SVG symbols in index.html and referenced by their ID.
 *
 * @example
 * ```html
 * <svg><use [attr.href]="ICONS.GLOBE"></use></svg>
 * ```
 */
export const ICONS = Object.freeze({
  // Lucide — stroke-based UI icons
  GLOBE: '#icon-globe',

  // Simple Icons — brand logos (fill-based)
  SI_FACEBOOK: '#si-facebook',
  SI_TWITTER: '#si-x',
  SI_TELEGRAM: '#si-telegram',
  SI_LINKEDIN: '#si-linkedin',
  SI_SLACK: '#si-slack',
  SI_GOOGLE: '#si-google',
  SI_PINTEREST: '#si-pinterest',
} as const);

export type IconType = (typeof ICONS)[keyof typeof ICONS];
