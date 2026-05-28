/**
 * Checks if a URL starts with http:// or https://.
 * Returns false for null/undefined.
 */
export const isHttpUrl = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return value.startsWith('http://') || value.startsWith('https://');
};
