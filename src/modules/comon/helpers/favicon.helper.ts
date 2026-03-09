import { ICONS } from '../constants/icons.const';

/**
 * Utility class for handling website favicons.
 */
export class FaviconHelper {
  /** * Google's S2 Favicon service endpoint.
   * @private
   */
  private static readonly GOOGLE_FAVICON_API = 'https://s2.googleusercontent.com/s2/favicons';

  /**
   * Generates a URL for a website's favicon using Google's S2 service.
   * Handles URL normalization and provides a fallback icon for invalid inputs.
   *
   * @guideline DZ_07 - Strict TypeScript typing
   * @guideline DZ_08 - Robust error handling & logging
   *
   * @param siteUrl - The raw URL or domain of the website
   * @param size - The desired size of the favicon in pixels (default: 32)
   * @returns A fully qualified URL to the favicon image or a default GLOBE icon
   *
   * @example
   * ```typescript
   * // Basic domain
   * FaviconHelper.getGoogleUrl('google.com');
   * // Returns: '[https://s2.googleusercontent.com/s2/favicons?domain=google.com&sz=32](https://s2.googleusercontent.com/s2/favicons?domain=google.com&sz=32)'
   *
   * // Full URL with protocol
   * FaviconHelper.getGoogleUrl('[https://github.com/angular](https://github.com/angular)', 64);
   * // Returns: '[https://s2.googleusercontent.com/s2/favicons?domain=github.com&sz=64](https://s2.googleusercontent.com/s2/favicons?domain=github.com&sz=64)'
   *
   * // Invalid input
   * FaviconHelper.getGoogleUrl('not-a-url');
   * // Returns: ICONS.GLOBE
   * ```
   */
  static getGoogleUrl(siteUrl: string | null | undefined, size = 32): string {
    const trimmedUrl = siteUrl?.trim();

    if (!trimmedUrl) {
      return ICONS.GLOBE;
    }

    // Normalize URL by ensuring protocol exists for URL constructor
    const normalizedUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;

    try {
      const url = new URL(normalizedUrl);

      // Filter out empty hostnames or local environments
      if (!url.hostname || url.hostname === 'localhost') {
        return ICONS.GLOBE;
      }

      return `${this.GOOGLE_FAVICON_API}?domain=${url.hostname}&sz=${size}`;
    } catch {
      // In case of parsing errors, fallback to default icon
      return ICONS.GLOBE;
    }
  }
}
