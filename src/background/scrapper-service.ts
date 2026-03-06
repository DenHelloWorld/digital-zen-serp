import { logger } from '../modules/comon/helpers/logger';
import { ScrapedMetadata } from '../modules/comon/models/scrapped-metadata.model';
import { parseHTML } from 'linkedom';

interface JsonLdPerson {
  name?: string;
}
interface JsonLdBrand {
  name?: string;
}
interface JsonLdImage {
  url?: string;
}

interface JsonLdData {
  headline?: string;
  description?: string;
  articleBody?: string;
  author?: string | JsonLdPerson | JsonLdPerson[];
  image?: string | JsonLdImage | (string | JsonLdImage)[];
  brand?: JsonLdBrand;
}

type MetadataRule = (doc: Document, linkedData: JsonLdData) => string | null | undefined;

export class ScraperService {
  readonly #logger = logger.createLogger('ScraperService');

  readonly #TITLE_RULES: MetadataRule[] = [
    doc => doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[property="twitter:title"]')?.getAttribute('content'),
    doc => doc.querySelector('title')?.textContent,
    (_, linkedData) => linkedData.headline,
    doc => doc.querySelector('.post-title')?.textContent,
    doc => doc.querySelector('.entry-title')?.textContent,
    doc => doc.querySelector('h1[class*="title" i] a')?.textContent,
    doc => doc.querySelector('h1[class*="title" i]')?.textContent,
  ];

  readonly #DESCRIPTION_RULES: MetadataRule[] = [
    doc => doc.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[property="twitter:description"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[name="description"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[itemprop="description"]')?.getAttribute('content'),
    (_, linkedData) => linkedData.articleBody,
    (_, linkedData) => linkedData.description,
  ];

  readonly #AUTHOR_RULES: MetadataRule[] = [
    (_, linkedData) => this.#parseJsonLdAuthor(linkedData),
    // Добавь проверку бренда из JSON-LD (часто там имя автора/компании)
    (_, linkedData) => linkedData.brand?.name,

    doc => doc.querySelector('meta[name="author"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[property="article:author"]')?.getAttribute('content'),

    // Microdata (очень часто на сайтах)
    doc => doc.querySelector('[itemprop*="author" i] [itemprop="name"]')?.textContent,
    doc => doc.querySelector('[itemprop*="author" i]')?.textContent,

    // Стандартная ссылка на автора
    doc => doc.querySelector('[rel="author"]')?.textContent,

    // Специфические классы (то, что у тебя было .author-name, но шире)
    doc => doc.querySelector('.author-name')?.textContent,
    doc => doc.querySelector('a[class*="author" i]')?.textContent,
    doc => doc.querySelector('[class*="author" i] a')?.textContent,
    doc => doc.querySelector('a[href*="/author/" i]')?.textContent,

    // Byline (подпись под статьей)
    doc => doc.querySelector('[class*="byline" i]')?.textContent,
  ];

  readonly #IMAGE_RULES: MetadataRule[] = [
    // 1. Open Graph (все варианты)
    doc => doc.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[property="og:image:url"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),

    // 2. Twitter (все варианты, включая :src)
    doc => doc.querySelector('meta[name="twitter:image:src"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[property="twitter:image:src"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
    doc => doc.querySelector('meta[property="twitter:image"]')?.getAttribute('content'),

    // 3. Schema.org и JSON-LD
    doc => doc.querySelector('meta[itemprop="image"]')?.getAttribute('content'),
    (_, linkedData) => this.#parseJsonLdImage(linkedData),

    // 4. Специфические теги
    doc => doc.querySelector('link[rel="image_src"]')?.getAttribute('href'),

    // 5. Контентные картинки (DOM)
    doc => doc.querySelector('article img[src]')?.getAttribute('src'),
    doc => doc.querySelector('#content img[src]')?.getAttribute('src'),
    doc => doc.querySelector('img[alt*="author" i]')?.getAttribute('src'),

    // 6. Последний шанс: любая картинка, которая не скрыта для скринридеров
    doc => doc.querySelector('img[src]:not([aria-hidden="true"])')?.getAttribute('src'),
  ];

  // --- ОСНОВНОЙ МЕТОД ---
  public extractMetadata(html: string, url: string): ScrapedMetadata {
    try {
      const { document: doc } = parseHTML(html);
      const linkedData = this.#getJsonLd(doc);
      const baseUrl = new URL(url).origin;

      const title = this.#resolve(doc, linkedData, this.#TITLE_RULES);
      const rawDescription = this.#resolve(doc, linkedData, this.#DESCRIPTION_RULES) || '';

      const { author: dribbleAuthor, description: cleanDescription } =
        this.#dribbleSplit(rawDescription);
      const author = this.#resolve(doc, linkedData, this.#AUTHOR_RULES) || dribbleAuthor;
      const image = this.#resolve(doc, linkedData, this.#IMAGE_RULES);

      return {
        url,
        title: this.#clean(title),
        description: this.#clean(cleanDescription),
        author: this.#clean(author),
        image: this.#formatImg(image, baseUrl),
      };
    } catch (error) {
      this.#logger.error(`Scraping failed for ${url}`, error);
      throw error;
    }
  }

  // --- ДВИЖОК РЕЗОЛВЕРА ---
  #resolve(doc: Document, linkedData: JsonLdData, rules: MetadataRule[]): string | null {
    for (const rule of rules) {
      const result = rule(doc, linkedData);
      if (result && result.trim().length > 0) return result.trim();
    }
    return null;
  }

  // --- ПАРСЕРЫ ---
  #getJsonLd(doc: Document): JsonLdData {
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

  #parseJsonLdAuthor(linkedData: JsonLdData): string | null {
    const authorData = linkedData.author;
    if (!authorData) return null;

    if (typeof authorData === 'string') return authorData;

    if (Array.isArray(authorData)) {
      const firstAuthor = authorData[0];
      if (!firstAuthor) return null;
      return firstAuthor.name || null;
    }

    return authorData.name || null;
  }

  #parseJsonLdImage(linkedData: JsonLdData): string | null {
    const imageData = linkedData.image;
    if (!imageData) return null;

    if (typeof imageData === 'string') return imageData;

    if (Array.isArray(imageData)) {
      const firstImage = imageData[0];
      if (!firstImage) return null;
      return typeof firstImage === 'string' ? firstImage : firstImage.url || null;
    }

    return imageData.url || null;
  }

  // --- УТИЛИТЫ ---
  #dribbleSplit(raw: string): { author: string | null; description: string | null } {
    if (!raw.includes(' | ')) return { author: null, description: raw };
    const parts = raw.split(' | ').map(p => p.trim());
    if (parts.length > 1 && parts[parts.length - 1].includes('Connect with them')) parts.pop();
    return {
      author: parts[0] || null,
      description: parts.length > 1 ? parts.slice(1).join(' | ') : parts[0],
    };
  }

  #clean(value: string | null): string | null {
    if (!value) return null;
    return (
      value
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/<\/?[^>]+(>|$)/g, '') || null
    );
  }

  #formatImg(imgUrl: string | null, baseUrl: string): string | null {
    if (!imgUrl) return null;
    try {
      return new URL(imgUrl, baseUrl).href;
    } catch {
      return imgUrl;
    }
  }
}
