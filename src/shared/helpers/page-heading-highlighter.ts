/**
 * Configuration object sent to the injected highlight function.
 * Defined here (not imported) because this file is serialised
 * via toString() by chrome.scripting.executeScript and must
 * be fully self-contained — no import statements survive.
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
export const applyHeadingHighlights = (
  config: HeadingHighlighterConfig
): {
  headingsFound: number;
} => {
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
};

/**
 * Runs inside the web page context via chrome.scripting.executeScript.
 * Scrolls to a specific heading by its data-dz-heading-id and briefly
 * flashes a heading-level-specific colour.
 *
 * @returns Whether the heading element was found.
 */
export const scrollToHeading = (
  headingId: number,
  tagName: string
): { success: boolean } => {
  const TAG_COLORS_MAP: Record<string, string> = {
    h1: '#ef4444',
    h2: '#3b82f6',
    h3: '#22c55e',
    h4: '#f97316',
    h5: '#a855f7',
    h6: '#6b7280',
  };

  const el = document.querySelector<HTMLElement>(`[data-dz-heading-id="${headingId}"]`);
  if (!el) return { success: false };

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  /* Flash highlight — use heading-level colour */
  const color = TAG_COLORS_MAP[tagName.toLowerCase()] || '#6b7280';
  const originalBg = el.style.background;
  const originalTransition = el.style.transition;
  el.style.transition = 'background 0.3s ease';
  el.style.background = color;

  setTimeout(() => {
    el.style.background = originalBg;
    el.style.transition = originalTransition;
  }, 2000);

  return { success: true };
};
