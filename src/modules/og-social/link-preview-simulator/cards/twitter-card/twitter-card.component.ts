import type { PreviewCardData } from '../../preview-card-data.model';
import { Component, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-twitter-card',
  imports: [TranslocoDirective],
  templateUrl: './twitter-card.component.html',
  host: { class: 'flex flex-col gap-1 w-full max-w-[400px]' },
})
export class TwitterCardComponent {
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
