/**
 * Represents a single heading element found on the page.
 */
export interface HeadingData {
  /** Sequential number starting from 1 */
  id: number;
  /** Tag name in upper case, e.g. "H1", "H2" */
  tagName: string;
  /** Text content — trimmed, internal whitespace collapsed to single space */
  text: string;
  /** Numeric nesting level extracted from tag name (1 for H1, 6 for H6) */
  nestingLevel: number;
  /** Validation errors found for this heading (empty array if valid) */
  errors: HeadingErrorType[];
}

/**
 * Machine-readable validation error codes for a heading.
 */
export type HeadingErrorType = 'EMPTY_TEXT' | 'DUPLICATE_TEXT' | 'LEVEL_GAP';
