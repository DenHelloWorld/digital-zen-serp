/**
 * Removes the protocol (http:// or https://) from a URL string.
 *
 * Behavior:
 * - Returns an empty string if the input is null, undefined, or empty.
 * - Removes 'http://' or 'https://' from the start of the string.
 * - Returns the original string if no protocol is found.
 *
 * @param value - The URL string to clean, or a null/undefined value.
 * @returns The string without the protocol.
 *
 * @example
 * cleanProtocolHelper('https://example.com/page') // returns 'example.com/page'
 * cleanProtocolHelper('http://localhost:3000')    // returns 'localhost:3000'
 * cleanProtocolHelper(undefined)                 // returns ''
 */
export const cleanProtocolHelper = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }

  return value.replace(/^https?:\/\//, '');
};
