import { ICONS } from '../constants/icons.const';

export class FaviconHelper {
  private static readonly GOOGLE_FAVICON_API = 'https://s2.googleusercontent.com/s2/favicons';

  static getGoogleUrl(siteUrl: string | null | undefined, size = 32): string {
    const trimmedUrl = siteUrl?.trim();

    if (!trimmedUrl) {
      return ICONS.GLOBE;
    }

    const normalizedUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;

    try {
      const url = new URL(normalizedUrl);

      if (!url.hostname || url.hostname === 'localhost') {
        return ICONS.GLOBE;
      }

      return `${this.GOOGLE_FAVICON_API}?domain=${url.hostname}&sz=${size}`;
    } catch {
      return ICONS.GLOBE;
    }
  }
}
