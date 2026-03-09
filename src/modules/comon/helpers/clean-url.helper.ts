/**
 * Cleans a URL by returning its origin (protocol + domain + port).
 * * * Behavior:
 * - Returns an empty string if the input is null, undefined, or empty.
 * - Returns the original string if the input is not a valid URL.
 * - Returns the original string if the protocol doesn't have a valid origin
 * (e.g., 'about:', 'data:', 'blob:'), preventing the Browser API from returning the string "null".
 * * @param value - The URL string to clean, or a null/undefined value.
 * @returns The URL origin or the original value if an origin cannot be determined.
 * * @example
 * cleanUrlHelper('https://example.com/page?id=1') // returns 'https://example.com'
 * cleanUrlHelper('about:config')                 // returns 'about:config'
 * cleanUrlHelper(undefined)                      // returns ''
 */
export const cleanUrlHelper = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);

    // The URL API returns the string "null" (as text) for opaque origins
    // like 'about:', 'data:', or 'blob:'. We check for this specifically
    // to avoid returning a misleading "null" string.
    if (url.origin === 'null') {
      return value;
    }

    // Remove www. prefix from hostname for consistent comparison
    const hostname = url.hostname.replace(/^www\./, '');
    const port = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${hostname}${port}`;
  } catch {
    return value;
  }
};
