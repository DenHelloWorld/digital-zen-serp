import type { HeadingData, HeadingErrorType } from '../models/heading-data.model';

/**
 * Runs inside the web page context via chrome.scripting.executeScript.
 * Finds all H1–H6 elements in DOM order and returns a flat array of HeadingData.
 *
 * @remarks Must be self-contained (no external references)
 * because it is serialised and executed in an isolated page context.
 */
export const parsePageHeadings = (): HeadingData[] => {
  const tags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const selector = tags.join(',');
  const elements = document.querySelectorAll(selector);
  const results: HeadingData[] = [];
  let id = 0;

  for (const el of elements) {
    const tagName = el.tagName.toUpperCase();
    let text = (el as HTMLElement).textContent ?? '';
    text = text.trim().replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();

    id++;
    const nestingLevel = parseInt(tagName.charAt(1), 10);

    results.push({
      id,
      tagName,
      text,
      nestingLevel,
      errors: [],
    });
  }

  return results;
};

/**
 * Validates an array of parsed headings and attaches error codes
 * directly to each heading node under `errors`.
 *
 * Checks performed:
 *   - EMPTY_TEXT  — heading has no text content after cleaning
 *   - DUPLICATE_TEXT — same non-empty text appears in multiple headings
 *   - LEVEL_GAP   — nesting level jumps down by more than 1 (e.g. H1 → H3)
 */
export const validateHeadings = (headings: HeadingData[]): HeadingData[] => {
  /* ── 1. EMPTY_TEXT ────────────────────────────────────────── */
  for (const h of headings) {
    if (h.text.length === 0) {
      addError(h, 'EMPTY_TEXT');
    }
  }

  /* ── 2. DUPLICATE_TEXT (non-empty only) ───────────────────── */
  const textMap = new Map<string, number[]>();
  for (const h of headings) {
    if (h.text.length === 0) continue;
    const ids = textMap.get(h.text) ?? [];
    ids.push(h.id);
    textMap.set(h.text, ids);
  }
  for (const [, ids] of textMap) {
    if (ids.length < 2) continue;
    for (const id of ids) {
      const heading = headings.find(h => h.id === id);
      if (heading) addError(heading, 'DUPLICATE_TEXT');
    }
  }

  /* ── 3. LEVEL_GAP — skip when going deeper ────────────────── */
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr.nestingLevel > prev.nestingLevel + 1) {
      addError(curr, 'LEVEL_GAP');
    }
  }

  return headings;
};

const addError = (heading: HeadingData, type: HeadingErrorType): void => {
  if (!heading.errors.includes(type)) {
    heading.errors.push(type);
  }
};
