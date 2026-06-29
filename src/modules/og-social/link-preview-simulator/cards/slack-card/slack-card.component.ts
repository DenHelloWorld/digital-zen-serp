import { FaviconComponent } from '../../../../ui/favicon/favicon.component';
import type { PreviewCardData } from '../../preview-card-data.model';
import { Component, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-slack-card',
  imports: [TranslocoDirective, FaviconComponent],
  templateUrl: './slack-card.component.html',
  host: { class: 'flex flex-col w-full max-w-[400px]' },
})
export class SlackCardComponent {
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
