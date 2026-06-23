import type { PreviewCardData } from '../../preview-card-data.model';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-pinterest-card',
  imports: [TranslocoDirective],
  templateUrl: './pinterest-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col w-full max-w-[220px]' },
})
export class PinterestCardComponent {
  readonly data = input.required<PreviewCardData>();
  protected readonly imgError = signal(false);
  protected onImgError(): void {
    this.imgError.set(true);
  }
  protected truncate(text: string | null, max: number): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}
