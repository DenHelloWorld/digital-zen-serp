/**
 * All heading tag names.
 */
export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * Maps each heading tag to its highlight colour.
 * Exported for use in the UI (colour swatches next to tag buttons).
 */
export const TAG_COLORS: Record<string, string> = {
  h1: '#ef4444',
  h2: '#3b82f6',
  h3: '#22c55e',
  h4: '#f97316',
  h5: '#a855f7',
  h6: '#6b7280',
};

/**
 * Indicator dot colours for each feature status.
 * `dot` — solid dot colour, `ping` — ripple animation colour.
 * Keys match HighlighterStatus ('idle' | 'ok' | 'warning' | 'error').
 */
export const HIGHLIGHTER_STATUS_CONFIG = {
  idle: { dot: undefined, ping: undefined },
  ok: { dot: '#22c55e', ping: '#4ade80' },
  warning: { dot: '#eab308', ping: '#facc15' },
  error: { dot: '#ef4444', ping: '#f87171' },
} as const;

/**
 * Configuration object sent to the injected highlight function.
 */
export interface HeadingHighlighterConfig {
  enabled: boolean;
  selectedTags: Record<string, boolean>;
}

/**
 * Runs inside the web page context via chrome.scripting.executeScript.
 * Finds heading elements by tag, adds outline + badge.
 *
 * @remarks Must be fully self-contained (no external references)
 * because it is serialised and executed in an isolated page context.
 *
 * @returns Number of headings (h1-h6) found on the page.
 */
export function applyHeadingHighlights(config: HeadingHighlighterConfig): {
  headingsFound: number;
} {
  const TAG_COLORS_MAP: Record<string, string> = {
    h1: '#ef4444',
    h2: '#3b82f6',
    h3: '#22c55e',
    h4: '#f97316',
    h5: '#a855f7',
    h6: '#6b7280',
  };

  /** Count ALL headings on the page regardless of selected tags */
  const totalHeadings = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).reduce((sum, tag) => {
    return sum + document.querySelectorAll(tag).length;
  }, 0);

  /** Remove all previous highlights */
  document.querySelectorAll('[data-dz-highlight]').forEach(el => {
    const badge = el.querySelector('[data-dz-badge]');
    if (badge) badge.remove();
    el.removeAttribute('data-dz-highlight');
    const htmlEl = el as HTMLElement;
    htmlEl.style.outline = '';
    htmlEl.style.outlineOffset = '';
    htmlEl.style.position = '';
  });

  if (!config.enabled) return { headingsFound: totalHeadings };

  for (const [tag, active] of Object.entries(config.selectedTags)) {
    if (!active) continue;

    const color = TAG_COLORS_MAP[tag] || '#6b7280';
    document.querySelectorAll(tag).forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.setAttribute('data-dz-highlight', tag);
      htmlEl.style.outline = `2px solid ${color}`;
      htmlEl.style.outlineOffset = '2px';
      htmlEl.style.position = 'relative';

      const badge = document.createElement('span');
      badge.setAttribute('data-dz-badge', '');
      badge.textContent = `[${tag.toUpperCase()}]`;
      badge.style.cssText = [
        'position:absolute',
        'top:-14px',
        'left:0',
        'font-size:10px',
        'font-weight:bold',
        'color:white',
        `background:${color}`,
        'padding:0 4px',
        'border-radius:2px',
        'line-height:14px',
        'z-index:2147483647',
        'pointer-events:none',
        'font-family:sans-serif',
      ].join(';');
      htmlEl.appendChild(badge);
    });
  }

  return { headingsFound: totalHeadings };
}
