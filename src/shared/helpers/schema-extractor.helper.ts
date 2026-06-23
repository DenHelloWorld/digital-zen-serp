import type { SchemaBlock } from '../models/schema-data.model';

/**
 * Runs inside the web page context via chrome.scripting.executeScript.
 * Must be fully self-contained — no external references survive toString() serialisation.
 */
export const extractSchemaBlocks = (): SchemaBlock[] => {
  const blocks: SchemaBlock[] = [];
  let index = 0;

  const extractType = (obj: Record<string, unknown>): string => {
    const t = obj['@type'];
    if (Array.isArray(t)) return String(t[0]);
    return t ? String(t) : 'Unknown';
  };

  const flattenProps = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith('@')) continue;
      result[k] = v;
    }
    return result;
  };

  const addFromObj = (obj: Record<string, unknown>, raw: string): void => {
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        if (item && typeof item === 'object') {
          const child = item as Record<string, unknown>;
          blocks.push({
            format: 'json-ld',
            type: extractType(child),
            properties: flattenProps(child),
            raw,
            sourceIndex: index,
            rows: [],
            overallStatus: 'valid',
          });
        }
      }
      return;
    }
    blocks.push({
      format: 'json-ld',
      type: extractType(obj),
      properties: flattenProps(obj),
      raw,
      sourceIndex: index,
      rows: [],
      overallStatus: 'valid',
    });
  };

  // JSON-LD
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => {
    const raw = el.textContent?.trim() ?? '';
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === 'object') addFromObj(item as Record<string, unknown>, raw);
      }
    } catch (e) {
      blocks.push({
        format: 'json-ld',
        type: 'Unknown',
        properties: {},
        raw,
        sourceIndex: index,
        rows: [
          {
            property: '__parse_error__',
            value: String(e),
            status: 'invalid',
            message: { key: 'social.schema.parse_error' },
          },
        ],
        overallStatus: 'broken',
      });
    }
    index++;
  });

  // Microdata
  document.querySelectorAll('[itemscope]').forEach(el => {
    if (el.parentElement?.closest('[itemscope]')) return;
    const type = el.getAttribute('itemtype') ?? 'Unknown';
    const shortType = type.split('/').pop() ?? type;
    const props: Record<string, unknown> = {};
    el.querySelectorAll('[itemprop]').forEach(p => {
      if (p.closest('[itemscope]') !== el) return;
      const name = p.getAttribute('itemprop') ?? '';
      const val =
        (p as HTMLMetaElement).content ??
        (p as HTMLLinkElement).href ??
        p.textContent?.trim() ??
        null;
      props[name] = val;
    });
    blocks.push({
      format: 'microdata',
      type: shortType,
      properties: props,
      raw: el.outerHTML.slice(0, 2000),
      sourceIndex: index++,
      rows: [],
      overallStatus: 'valid',
    });
  });

  // RDFa
  document.querySelectorAll('[typeof]').forEach(el => {
    const type = el.getAttribute('typeof') ?? 'Unknown';
    const props: Record<string, unknown> = {};
    el.querySelectorAll('[property]').forEach(p => {
      const name = p.getAttribute('property') ?? '';
      const val =
        (p as HTMLMetaElement).content ??
        (p as HTMLLinkElement).href ??
        p.textContent?.trim() ??
        null;
      props[name] = val;
    });
    blocks.push({
      format: 'rdfa',
      type,
      properties: props,
      raw: el.outerHTML.slice(0, 2000),
      sourceIndex: index++,
      rows: [],
      overallStatus: 'valid',
    });
  });

  return blocks;
};
