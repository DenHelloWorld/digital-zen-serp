/**
 * Icon identifiers used throughout the application.
 * All icons are defined as SVG symbols in index.html and referenced by their ID.
 *
 * @example
 * ```html
 * <svg class="dz-icon">
 *   <use [attr.href]="icons.PLUS"></use>
 * </svg>
 * ```
 */
export const ICONS = Object.freeze({
  MIC: '#icon-mic',
  SEARCH: '#icon-search',
  GLOBE: '#icon-globe',
} as const);

/**
 * Type representing all available icon identifiers
 */
export type IconType = (typeof ICONS)[keyof typeof ICONS];
