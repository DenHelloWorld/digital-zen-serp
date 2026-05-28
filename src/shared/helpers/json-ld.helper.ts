interface JsonLdData {
  headline?: string;
  description?: string;
  articleBody?: string;
  author?: string | { name?: string } | { name?: string }[];
  image?: string | { url?: string } | (string | { url?: string })[];
  brand?: { name?: string };
  datePublished?: string;
  dateModified?: string;
}

/**
 * Parses the first LD+JSON script on a page and resolves @graph / array wrapping.
 */
export function getJsonLd(doc: Document): JsonLdData {
  try {
    const script = doc.querySelector('script[type="application/ld+json"]');
    if (!script?.textContent) return {};
    const parsed = JSON.parse(script.textContent);
    const data = parsed['@graph']
      ? parsed['@graph'][0]
      : Array.isArray(parsed)
        ? parsed[0]
        : parsed;
    return data || {};
  } catch {
    return {};
  }
}
