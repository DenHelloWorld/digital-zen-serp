import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import { computeOgBlockStatus } from '../../../shared/helpers/og-validator.helper';
import type {
  ImageCheckResult,
  MetaTag,
  OgBlockStatus,
} from '../../../shared/models/og-data.model';
import type { SchemaBlock } from '../../../shared/models/schema-data.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { TabActivityService } from '../services/tab-activity.service';
import { Injectable, signal, effect, inject, computed } from '@angular/core';

const IMAGE_TIMEOUT_MS = 5000;

export type MicrolinkStatus = 'idle' | 'loading' | 'ok' | 'error';

export interface MicrolinkData {
  title: string | null;
  description: string | null;
  url: string | null;
  image: { url: string } | null;
  publisher: string | null;
}

@Injectable({ providedIn: 'root' })
export class SchemaOgStore {
  readonly #schemaBlocks = signal<SchemaBlock[]>([]);
  readonly #metaTags = signal<MetaTag[]>([]);
  readonly #imageChecks = signal<Map<string, ImageCheckResult>>(new Map());
  readonly #loading = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #microlinkData = signal<MicrolinkData | null>(null);
  readonly #microlinkStatus = signal<MicrolinkStatus>('idle');

  readonly schemaBlocks = this.#schemaBlocks.asReadonly();
  readonly metaTags = this.#metaTags.asReadonly();
  readonly imageChecks = this.#imageChecks.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly microlinkData = this.#microlinkData.asReadonly();
  readonly microlinkStatus = this.#microlinkStatus.asReadonly();

  readonly ogBlockStatus = computed<OgBlockStatus>(() => computeOgBlockStatus(this.#metaTags()));

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  constructor() {
    effect(() => {
      this.#tabActivity.activeTab();
      this.load();
    });
  }

  /**
   * Fetches OG data via Microlink API (bot-side fetch, no cookies).
   * Free tier: 50 req/day/IP, no key required.
   *
   * @todo Consider replacing with a self-hosted bot to remove the rate limit,
   * support custom User-Agent (e.g. `facebookexternalhit`), and avoid third-party dependency.
   * @todo Cache results in `chrome.storage.session` keyed by URL (move fetch to background handler)
   * so repeated panel opens on the same page don't consume the daily quota.
   */
  async fetchMicrolink(url: string): Promise<void> {
    this.#microlinkStatus.set('loading');
    this.#microlinkData.set(null);
    try {
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
      const json = (await res.json()) as { status: string; data: MicrolinkData };
      if (json.status !== 'success') throw new Error(json.status);
      this.#microlinkData.set(json.data);
      this.#microlinkStatus.set('ok');
    } catch {
      this.#microlinkStatus.set('error');
    }
  }

  async load(): Promise<void> {
    this.#loading.set(true);
    this.#error.set(null);

    if (!this.#isChrome) {
      this.#loading.set(false);
      this.#error.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.COLLECT_SCHEMA_OG,
      });

      if (response?.success) {
        this.#schemaBlocks.set(response.data.schemaBlocks ?? []);
        this.#metaTags.set(response.data.metaTags ?? []);
        this.#checkImages(response.data.metaTags ?? []);
        const pageUrl: string = response.data.pageUrl;
        if (pageUrl) this.fetchMicrolink(pageUrl);
      } else {
        this.#error.set(response?.error ?? 'UNKNOWN_ERROR');
      }
    } catch (err) {
      this.#error.set('MESSAGE_SENDING_FAILED');
      console.error('[SchemaOgStore]', err);
    } finally {
      this.#loading.set(false);
    }
  }

  #checkImages(tags: MetaTag[]): void {
    const imageKeys = ['og:image', 'twitter:image'];
    const urls = tags.filter(t => imageKeys.includes(t.key) && t.value).map(t => t.value!);

    const current = new Map<string, ImageCheckResult>();
    this.#imageChecks.set(current);

    for (const url of urls) {
      this.#checkSingleImage(url).then(result => {
        const next = new Map(this.#imageChecks());
        next.set(url, result);
        this.#imageChecks.set(next);

        // Update metaTag statuses based on image check
        this.#applyImageCheckToTags(url, result);
      });
    }
  }

  #applyImageCheckToTags(url: string, result: ImageCheckResult): void {
    const tags = this.#metaTags().map(t => {
      if (t.value !== url) return t;
      if (result.loadStatus === 'error') {
        return {
          ...t,
          status: 'invalid' as const,
          statusMessage: { key: 'social.og.msg.image_not_accessible' },
        };
      }
      if (result.loadStatus === 'timeout') {
        return {
          ...t,
          status: 'invalid' as const,
          statusMessage: { key: 'social.og.msg.image_timeout' },
        };
      }
      if (result.loadStatus === 'ok' || result.loadStatus === 'size-unknown') {
        if (result.naturalWidth < 200 || result.naturalHeight < 200) {
          return {
            ...t,
            status: 'invalid' as const,
            statusMessage: {
              key: 'social.og.msg.image_too_small',
              params: { w: result.naturalWidth, h: result.naturalHeight },
            },
          };
        }
        if (result.naturalWidth < 600 || result.naturalHeight < 315) {
          return {
            ...t,
            status: 'warning' as const,
            statusMessage: {
              key: 'social.og.msg.image_below_recommended',
              params: { w: result.naturalWidth, h: result.naturalHeight },
            },
          };
        }
        const ratio = result.naturalWidth / result.naturalHeight;
        if (ratio < 1.6 || ratio > 2.2) {
          return {
            ...t,
            status: 'warning' as const,
            statusMessage: {
              key: 'social.og.msg.image_aspect_ratio',
              params: { ratio: ratio.toFixed(2) },
            },
          };
        }
        if (result.fileSizeBytes && result.fileSizeBytes > 8 * 1024 * 1024) {
          return {
            ...t,
            status: 'invalid' as const,
            statusMessage: { key: 'social.og.msg.image_too_large' },
          };
        }
      }
      return t;
    });
    this.#metaTags.set(tags);
  }

  async #checkSingleImage(url: string): Promise<ImageCheckResult> {
    const absUrl = url.startsWith('http') ? url : new URL(url, location.href).href;

    const loadPromise = new Promise<ImageCheckResult>(resolve => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.src = '';
        resolve({
          url: absUrl,
          naturalWidth: 0,
          naturalHeight: 0,
          fileSizeBytes: null,
          loadStatus: 'timeout',
        });
      }, IMAGE_TIMEOUT_MS);

      img.onload = async () => {
        clearTimeout(timer);
        let fileSizeBytes: number | null = null;
        try {
          const head = await fetch(absUrl, { method: 'HEAD', mode: 'cors' });
          const cl = head.headers.get('content-length');
          if (cl) fileSizeBytes = parseInt(cl, 10);
        } catch {
          // CORS blocked — size unknown
        }
        resolve({
          url: absUrl,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          fileSizeBytes,
          loadStatus: fileSizeBytes == null ? 'size-unknown' : 'ok',
        });
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve({
          url: absUrl,
          naturalWidth: 0,
          naturalHeight: 0,
          fileSizeBytes: null,
          loadStatus: 'error',
        });
      };

      img.src = absUrl;
    });

    return loadPromise;
  }

  reset(): void {
    this.#schemaBlocks.set([]);
    this.#metaTags.set([]);
    this.#imageChecks.set(new Map());
    this.#microlinkData.set(null);
    this.#microlinkStatus.set('idle');
    this.#loading.set(false);
    this.#error.set(null);
  }
}
