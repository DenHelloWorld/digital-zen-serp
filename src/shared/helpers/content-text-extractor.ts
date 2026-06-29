/**
 * Self-contained functions for chrome.scripting.executeScript.
 * NO imports allowed — all constants must be inlined.
 */

export interface ExtractedText {
  text: string;
  /** True when "main content" heuristic failed and fell back to full page */
  mainContentFallback: boolean;
}

/** Extracts all visible text from document.body */
export const extractFullText = (): ExtractedText => {
  const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS']);

  const isVisible = (el: Element): boolean => {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return true;
  };

  const collectText = (root: Element): string => {
    const parts: string[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent?.trim();
        if (t) parts.push(t);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      if (EXCLUDED_TAGS.has(el.tagName)) return;
      if (!isVisible(el)) return;
      for (const child of el.childNodes) walk(child);
    };
    walk(root);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  const text = collectText(document.body);
  return { text, mainContentFallback: false };
};

/** Extracts text from the main content area using heuristics (Readability-like) */
export const extractMainText = (): ExtractedText => {
  const EXCLUDED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS']);

  const NOISE_SELECTORS = [
    'nav',
    'header',
    'footer',
    'aside',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[role="complementary"]',
    '.nav',
    '.navigation',
    '.menu',
    '.sidebar',
    '.side-bar',
    '.header',
    '.footer',
    '.comments',
    '.comment-section',
    '.cookie',
    '.cookie-banner',
    '.ad',
    '.ads',
    '.advertisement',
    '.social-share',
    '.related-posts',
    '.breadcrumb',
    '.breadcrumbs',
  ];

  const CONTENT_SELECTORS = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '.main_content',
    '.post-content',
    '.post_content',
    '.entry-content',
    '.entry_content',
    '.article-content',
    '.article_content',
    '.page-content',
    '.page_content',
    '.content-body',
    '.content_body',
    '#content',
    '#main',
    '#main-content',
    '#post-content',
  ];

  const isVisible = (el: Element): boolean => {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return true;
  };

  const collectText = (root: Element): string => {
    const noiseEls = new Set<Element>();
    for (const sel of NOISE_SELECTORS) {
      try {
        root.querySelectorAll(sel).forEach(el => noiseEls.add(el));
      } catch {
        /* invalid selector — skip */
      }
    }

    const parts: string[] = [];
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent?.trim();
        if (t) parts.push(t);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element;
      if (EXCLUDED_TAGS.has(el.tagName)) return;
      if (noiseEls.has(el)) return;
      if (!isVisible(el)) return;
      for (const child of el.childNodes) walk(child);
    };
    walk(root);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };

  // Try content selectors in priority order
  for (const sel of CONTENT_SELECTORS) {
    try {
      const el = document.querySelector(sel);
      if (el && isVisible(el)) {
        const text = collectText(el);
        if (text.split(/\s+/).length >= 20) {
          return { text, mainContentFallback: false };
        }
      }
    } catch {
      /* invalid selector — skip */
    }
  }

  // Fallback: full page
  const parts: string[] = [];
  const walkFull = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent?.trim();
      if (t) parts.push(t);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (EXCLUDED_TAGS.has(el.tagName)) return;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    if (el.getAttribute('aria-hidden') === 'true') return;
    for (const child of el.childNodes) walkFull(child);
  };
  walkFull(document.body);
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  return { text, mainContentFallback: true };
};
