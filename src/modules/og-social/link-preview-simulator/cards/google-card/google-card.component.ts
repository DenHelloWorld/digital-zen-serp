import { FaviconHelper } from '../../../../comon/helpers/favicon.helper';
import type { PreviewCardData } from '../../preview-card-data.model';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'dz-google-card',
  templateUrl: './google-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col w-full max-w-[400px]' },
})
export class GoogleCardComponent {
  readonly data = input.required<PreviewCardData>();
  protected readonly faviconError = signal(false);
  protected readonly faviconSrc = computed(() =>
    FaviconHelper.getGoogleUrl(this.data().domain, 32)
  );
  protected onFaviconError(): void {
    this.faviconError.set(true);
  }
  protected truncate(text: string | null, max: number): string {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
}
