/**
 * Cleans a URL by returning its origin (protocol + domain + port).
 * Returns empty string for null/undefined inputs.
 *
 * @example
 * cleanUrl('https://example.com/page?id=1') // returns 'https://example.com'
 * cleanUrl('about:config')                  // returns 'about:config'
 */
export const cleanUrl = (value: string | null | undefined): string => {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.origin === 'null') return value;
    const hostname = url.hostname.replace(/^www\./, '');
    const port = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${hostname}${port}`;
  } catch {
    return value;
  }
};

/**
 * Removes the protocol (http:// or https://) from a URL string.
 * Returns empty string for null/undefined inputs.
 *
 * @example
 * cleanProtocol('https://example.com/page') // returns 'example.com/page'
 */
export const cleanProtocol = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/^https?:\/\//, '');
};
