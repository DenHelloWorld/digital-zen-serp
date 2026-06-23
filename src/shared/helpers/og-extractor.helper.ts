import type { MetaTag } from '../models/og-data.model';

/**
 * Runs inside the web page context via chrome.scripting.executeScript.
 * Must be fully self-contained — no external references survive toString() serialisation.
 */
export const extractMetaTags = (): MetaTag[] => {
  const tags: MetaTag[] = [];
  const seen = new Set<string>();

  const groupFor = (key: string): MetaTag['group'] => {
    if (key.startsWith('og:')) return 'og';
    if (key.startsWith('twitter:')) return 'twitter';
    if (key === 'fb:app_id' || key === 'fb:pages') return 'facebook';
    if (key.startsWith('article:')) return 'article';
    return 'basic';
  };

  document.querySelectorAll('meta[property], meta[name]').forEach(el => {
    const key = (el.getAttribute('property') || el.getAttribute('name') || '').toLowerCase().trim();
    if (!key) return;
    const value = el.getAttribute('content')?.trim() ?? null;

    const isRelevant =
      key.startsWith('og:') ||
      key.startsWith('twitter:') ||
      key.startsWith('article:') ||
      key === 'fb:app_id' ||
      key === 'fb:pages' ||
      key === 'description';

    if (!isRelevant) return;

    if (seen.has(key)) {
      const existing = tags.find(t => t.key === key);
      if (existing && existing.value !== value) {
        existing.status = 'invalid';
        existing.statusMessage = { key: 'social.og.msg.duplicate_conflict' };
      }
      return;
    }

    seen.add(key);
    tags.push({ key, value, group: groupFor(key), status: 'ok' });
  });

  // <title>
  if (!seen.has('title')) {
    const titleEl = document.querySelector('title');
    if (titleEl)
      tags.push({
        key: 'title',
        value: titleEl.textContent?.trim() ?? null,
        group: 'basic',
        status: 'ok',
      });
  }

  // canonical
  if (!seen.has('canonical')) {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical)
      tags.push({
        key: 'canonical',
        value: canonical.getAttribute('href'),
        group: 'basic',
        status: 'ok',
      });
  }

  return tags;
};
