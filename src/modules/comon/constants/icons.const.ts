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
  GLOBE: '#icon-globe',
  REFRESH_CW: '#icon-refresh-cw',
  LOADER: '#icon-loader',
  ALERT_TRIANGLE: '#icon-alert-triangle',
  BAN: '#icon-ban',
  INFO: '#icon-info',
  EYE: '#icon-eye',
  PENCIL: '#icon-pencil',
  INBOX: '#icon-inbox',
  SIGNAL: '#icon-signal',
  CALENDAR: '#icon-calendar',
  CLOCK: '#icon-clock',
  USER: '#icon-user',
} as const);

/**
 * Type representing all available icon identifiers
 */
export type IconType = (typeof ICONS)[keyof typeof ICONS];
