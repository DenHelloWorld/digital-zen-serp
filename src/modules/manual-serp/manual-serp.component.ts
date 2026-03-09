import { ICONS } from '../comon/constants/icons.const';
import { ScrapStore } from '../comon/stores/scrap.store';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { startWith, switchMap } from 'rxjs';

const CHAR_LIMITS = {
  title: 60,
  link: 75,
  description: 160,
};

@Component({
  selector: 'dz-manual-serp',
  imports: [FormsModule, TranslocoDirective],
  templateUrl: './manual-serp.component.html',
  styleUrl: './manual-serp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-manual-serp',
  },
})
export class ManualSerpComponent implements OnInit {
  protected readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');
  protected readonly icons = ICONS;
  protected readonly store = inject(ScrapStore);
  protected readonly title = signal('');
  protected readonly link = signal('');
  protected readonly description = signal('');
  protected readonly siteNameEdited = signal(false);
  protected readonly siteName = signal('');
  protected readonly transloco = inject(TranslocoService);
  readonly #destroyRef = inject(DestroyRef);
  protected readonly charLimits = CHAR_LIMITS;

  protected readonly descriptionSegments = computed(() => {
    const len = this.description().length;
    return {
      count: this.getBarCount(len, CHAR_LIMITS.description),
      color: this.getDescriptionColor(len),
    };
  });

  protected readonly titleSegments = computed(() => {
    const len = this.title().length;
    return {
      count: this.getBarCount(len, CHAR_LIMITS.title),
      color: this.getTitleColor(len),
    };
  });

  protected readonly linkSegments = computed(() => {
    const len = this.link().length;
    return {
      count: this.getBarCount(len, CHAR_LIMITS.link),
      color: this.getLinkColor(len),
    };
  });

  protected readonly titlePreview = computed(() =>
    this.truncateText(this.title(), CHAR_LIMITS.title)
  );
  protected readonly linkPreview = computed(() => this.truncateText(this.link(), CHAR_LIMITS.link));
  protected readonly descriptionPreview = computed(() =>
    this.truncateText(this.description(), CHAR_LIMITS.description)
  );

  public ngOnInit(): void {
    this.transloco.langChanges$
      .pipe(
        startWith(this.transloco.getActiveLang()),
        switchMap(lang => this.transloco.selectTranslate('serp.your_site', {}, lang)),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(value => {
        if (!this.siteNameEdited()) {
          this.siteName.set(value);
        }
      });
  }

  protected adjustHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  private getBarCount(length: number, limit: number): number {
    if (length === 0) return 0;
    return Math.min(5, Math.ceil((length / limit) * 5));
  }

  private getTitleColor(length: number): string {
    if (length === 0) return 'bg-gray-200';
    if (length < 20) return 'bg-red-500';
    if (length <= 30) return 'bg-orange-500';
    if (length <= CHAR_LIMITS.title) return 'bg-green-500';
    return 'bg-red-500';
  }

  private getDescriptionColor(length: number): string {
    if (length === 0) return 'bg-gray-200';
    if (length < 70) return 'bg-red-500';
    if (length <= 100) return 'bg-orange-500';
    if (length <= CHAR_LIMITS.description) return 'bg-green-500';
    return 'bg-red-500';
  }

  private getLinkColor(length: number): string {
    if (length === 0) return 'bg-gray-200';
    if (length <= CHAR_LIMITS.link) return 'bg-green-500';
    return 'bg-red-500';
  }

  private truncateText(value: string, limit: number): string {
    if (!value) return '';
    return value.length <= limit ? value : `${value.slice(0, limit)}\u2026`;
  }
}
