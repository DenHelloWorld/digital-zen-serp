import { ICONS } from '../comon/constants/icons.const';
import { ScrapStore } from '../comon/stores/scrap.store';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';

const SERP_LIMITS = {
  desktop: {
    titlePx: 580,
    descPx: 920,
    titleFont: '18px Arial, sans-serif',
    descFont: '14px Arial, sans-serif',
    linkMaxLen: 75,
  },
  mobile: {
    titlePx: 560,
    descPx: 750, // На мобильных описание обрезается раньше по ширине, но строк больше
    titleFont: '20px Arial, sans-serif', // На мобилках шрифт в выдаче чуть крупнее
    descFont: '14px Arial, sans-serif',
    linkMaxLen: 50,
  },
};

@Component({
  selector: 'dz-google-serp',
  imports: [FormsModule, TranslocoDirective],
  templateUrl: './google-serp.component.html',
  styleUrl: './google-serp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-google-serp',
  },
})
export class GoogleSerpComponent implements OnInit {
  protected readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');
  protected readonly icons = ICONS;
  protected readonly store = inject(ScrapStore);
  protected readonly title = signal('');
  protected readonly link = signal('');

  protected readonly description = signal('');

  protected readonly descriptionWidthPx = computed(() => {
    const text = this.description();
    const device = this.selectedDevice();
    const font = SERP_LIMITS[device].descFont;

    if (!text) return 0;
    return this.measureTextWidth(text, font);
  });

  protected readonly descriptionSegments = computed(() => {
    const width = this.descriptionWidthPx();
    const device = this.selectedDevice();
    const maxSafe = SERP_LIMITS[device].descPx;

    if (width === 0) return { count: 0, color: 'bg-gray-200' };
    if (width < 300) return { count: 2, color: 'bg-orange-500' };
    if (width <= maxSafe) return { count: 5, color: 'bg-green-500' };
    return { count: 1, color: 'bg-red-500' };
  });

  protected readonly titleSegments = computed(() => {
    const width = this.titleWidthPx();
    const device = this.selectedDevice();
    const maxSafe = SERP_LIMITS[device].titlePx;

    if (width === 0) return { count: 0, color: 'bg-gray-200' };

    // Слишком короткий (мало веса для SEO)
    if (width < 200) return { count: 2, color: 'bg-orange-500' };
    // Идеально попадает в границы
    if (width <= maxSafe) return { count: 5, color: 'bg-green-500' };
    // Небольшой перебор (Google может обрезать, а может и нет, зависит от слов)
    if (width <= maxSafe + 40) return { count: 4, color: 'bg-yellow-500' };
    // Явный перебор
    return { count: 1, color: 'bg-red-500' };
  });
  protected readonly titleWidthPx = computed(() => {
    const text = this.title();
    const device = this.selectedDevice();
    const font = SERP_LIMITS[device].titleFont;

    if (!text) return 0;
    return this.measureTextWidth(text, font);
  });
  protected readonly linkSegments = computed(() => {
    const len = this.link().length;
    const device = this.selectedDevice();
    const maxSafe = SERP_LIMITS[device].linkMaxLen;

    if (len === 0) return { count: 0, color: 'bg-gray-200' };

    // Логика:
    if (len < 10) return { count: 2, color: 'bg-orange-500' }; // Слишком короткий (неинформативный)
    if (len <= maxSafe) return { count: 5, color: 'bg-green-500' }; // Идеально
    if (len <= maxSafe + 20) return { count: 4, color: 'bg-yellow-500' }; // Длинноват, будет сокращен
    return { count: 1, color: 'bg-red-500' }; // Очень длинный URL
  });

  public ngOnInit(): void {
    this.store.scrapCurrentTab();
  }

  protected adjustHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  private measureTextWidth(text: string, font: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font;
      return Math.round(context.measureText(text).width);
    }
    return 0;
  }
}
