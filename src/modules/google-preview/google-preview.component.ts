import { isHttpUrl } from '../../shared/helpers/is-http-url.helper';
import {
  truncateText,
  getBarCount,
  getTitleColor,
  getDescriptionColor,
  getLinkColor,
} from '../../shared/helpers/serp-bar.helper';
import { CHAR_LIMITS } from '../comon/constants/char-limits.const';
import { ICONS } from '../comon/constants/icons.const';
import { FaviconHelper } from '../comon/helpers/favicon.helper';
import { cleanProtocol, cleanUrl } from '../comon/helpers/url.helper';
import { GooglePreviewStore } from '../comon/stores/google-preview.store';
import { CopyButtonComponent } from '../ui/copy-button/copy-button.component';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'dz-google-preview',
  imports: [TranslocoDirective, FormsModule, CopyButtonComponent],
  templateUrl: './google-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'dz-google-preview p-[var(--spacing)] flex flex-col items-center gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class GooglePreviewComponent implements OnInit {
  readonly #destroyRef = inject(DestroyRef);
  readonly #transloco = inject(TranslocoService);
  readonly #store = inject(GooglePreviewStore);

  constructor() {
    effect(() => {
      this.activeTab();
      this.#iconStage.set(0);
    });
  }

  /* ── Mode ─────────────────────────────────── */
  protected readonly mode = signal<'live' | 'edit'>('live');

  /* ── Live: data from active tab ──────────── */
  protected readonly activeTab = computed(() => this.#store.activeTab());
  protected readonly currentTabPreview = computed(() => this.#store.currentTabPreview());
  protected readonly isPreviewLoading = computed(() => this.#store.isPreviewLoading());
  protected readonly previewError = computed(() => this.#store.previewError());

  /* ── Edit: local signals ─────────────────── */
  protected readonly editTitle = signal('');
  protected readonly editLink = signal('');
  protected readonly editDescription = signal('');
  protected readonly editSiteName = signal('');
  protected readonly editSiteNameEdited = signal(false);

  /* ── Device toggle ─────────────────────────── */
  protected readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');

  /* ── Computed: active values ─────────────── */
  protected readonly icons = ICONS;
  protected readonly charLimits = CHAR_LIMITS;
  protected readonly isHttpUrl = isHttpUrl;

  protected readonly name = computed(() => {
    if (this.mode() === 'edit')
      return this.editSiteName() || this.#transloco.translate('serp.your_site');
    return this.currentTabPreview()?.author ?? '';
  });

  protected readonly url = computed(() => {
    if (this.mode() === 'edit') return this.editLink();
    return cleanProtocol(cleanUrl(this.activeTab()?.url ?? ''));
  });

  protected readonly title = computed(() => {
    if (this.mode() === 'edit') return this.editTitle();
    return this.currentTabPreview()?.title ?? '';
  });

  protected readonly description = computed(() => {
    if (this.mode() === 'edit') return this.editDescription();
    return this.currentTabPreview()?.description ?? '';
  });

  protected readonly link = computed(() => {
    if (this.mode() === 'edit') return this.editLink();
    return this.currentTabPreview()?.url ?? '';
  });

  /** 0 = tab favicon, 1 = /favicon.ico, 2 = Google S2, 3 = null */
  readonly #iconStage = signal(0);

  protected readonly iconUrl = computed((): string | null => {
    const stage = this.#iconStage();
    const url = this.activeTab()?.url ?? '';
    const origin = this.#origin(url);
    // 0: Chrome tab favicon — best quality, already resolved to highest-res icon
    if (stage === 0) {
      const tab = this.activeTab()?.favIconUrl ?? '';
      return isHttpUrl(tab) ? tab : origin ? `${origin}/favicon.ico` : this.#s2(url);
    }
    // 1: /favicon.ico
    if (stage === 1) return origin ? `${origin}/favicon.ico` : this.#s2(url);
    // 2: Google S2
    if (stage === 2) return this.#s2(url);
    return null;
  });

  #origin(url: string): string | null {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }

  #s2(url: string): string | null {
    const s2 = FaviconHelper.getGoogleUrl(cleanUrl(url));
    return isHttpUrl(s2) ? s2 : null;
  }

  protected onIconError(): void {
    this.#iconStage.update(s => s + 1);
  }

  protected readonly editLinkUrl = computed(() => cleanProtocol(cleanUrl(this.editLink())));

  protected readonly linkPreview = computed(() => truncateText(this.link(), CHAR_LIMITS.link));
  protected readonly titlePreview = computed(() => truncateText(this.title(), CHAR_LIMITS.title));
  protected readonly descriptionPreview = computed(() =>
    truncateText(this.description(), CHAR_LIMITS.description)
  );

  protected readonly titleSegments = computed(() => {
    const len = this.title().length;
    return { count: getBarCount(len, CHAR_LIMITS.title), color: getTitleColor(len) };
  });

  protected readonly descriptionSegments = computed(() => {
    const len = this.description().length;
    return { count: getBarCount(len, CHAR_LIMITS.description), color: getDescriptionColor(len) };
  });

  protected readonly linkSegments = computed(() => {
    const len = this.link().length;
    return { count: getBarCount(len, CHAR_LIMITS.link), color: getLinkColor(len) };
  });

  /* ── Init ──────────────────────────────────── */
  ngOnInit(): void {
    const setDefaultSiteName = (lang: string) => {
      if (!this.editSiteNameEdited()) {
        this.editSiteName.set(this.#transloco.translate('serp.your_site', {}, lang));
      }
    };

    setDefaultSiteName(this.#transloco.getActiveLang());
    const sub = this.#transloco.langChanges$.subscribe(lang => setDefaultSiteName(lang));
    this.#destroyRef.onDestroy(() => sub.unsubscribe());
  }

  protected adjustHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  protected switchMode(m: 'live' | 'edit'): void {
    this.mode.set(m);
  }

  protected onEditSiteNameChange(value: string): void {
    if (this.mode() === 'edit') {
      this.editSiteName.set(value);
      this.editSiteNameEdited.set(true);
    }
  }
}
