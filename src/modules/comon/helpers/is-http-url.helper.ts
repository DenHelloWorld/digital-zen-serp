/**
 * Checks if the provided URL starts with the 'http' protocol.
 * @param url - The URL string to evaluate (can be null or undefined).
 * @returns {boolean} True if the URL is null or undefined, or if the URL string starts with 'http'.
 */
export const isHttpUrl = (url: string | null | undefined): boolean => {
  if (!url) {
    return false;
  }

  return url.startsWith('http://') || url.startsWith('https://');
};
