import {
  truncateText,
  getBarCount,
  getTitleColor,
  getDescriptionColor,
  getLinkColor,
} from '../../shared/helpers/serp-bar.helper';
import { CHAR_LIMITS } from '../comon/constants/char-limits.const';
import { ICONS } from '../comon/constants/icons.const';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'dz-manual-serp',
  imports: [FormsModule, TranslocoDirective],
  templateUrl: './manual-serp.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'dz-manual-serp p-[var(--spacing)] flex justify-center flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class ManualSerpComponent implements OnInit {
  readonly #destroyRef = inject(DestroyRef);
  protected readonly transloco = inject(TranslocoService);

  protected readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');
  protected readonly icons = ICONS;
  protected readonly title = signal('');
  protected readonly link = signal('');
  protected readonly description = signal('');
  protected readonly siteNameEdited = signal(false);
  protected readonly siteName = signal('');

  protected readonly descriptionSegments = computed(() => {
    const len = this.description().length;
    return {
      count: getBarCount(len, CHAR_LIMITS.description),
      color: getDescriptionColor(len),
    };
  });
  protected readonly titleSegments = computed(() => {
    const len = this.title().length;
    return {
      count: getBarCount(len, CHAR_LIMITS.title),
      color: getTitleColor(len),
    };
  });
  protected readonly linkSegments = computed(() => {
    const len = this.link().length;
    return {
      count: getBarCount(len, CHAR_LIMITS.link),
      color: getLinkColor(len),
    };
  });
  protected readonly titlePreview = computed(() => truncateText(this.title(), CHAR_LIMITS.title));
  protected readonly linkPreview = computed(() => truncateText(this.link(), CHAR_LIMITS.link));
  protected readonly descriptionPreview = computed(() =>
    truncateText(this.description(), CHAR_LIMITS.description)
  );

  protected readonly charLimits = CHAR_LIMITS;

  public ngOnInit(): void {
    const setDefaultSiteName = (lang: string) => {
      if (!this.siteNameEdited()) {
        this.siteName.set(this.transloco.translate('serp.your_site', {}, lang));
      }
    };

    setDefaultSiteName(this.transloco.getActiveLang());

    const sub = this.transloco.langChanges$.subscribe(lang => setDefaultSiteName(lang));
    this.#destroyRef.onDestroy(() => sub.unsubscribe());
  }

  protected adjustHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}
