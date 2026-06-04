import { isHttpUrl } from '../../../shared/helpers/is-http-url.helper';
import { FaviconHelper } from '../../comon/helpers/favicon.helper';
import { CopyButtonComponent } from '../copy-button/copy-button.component';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'dz-url-bar',
  imports: [CopyButtonComponent],
  template: `
    <div class="flex items-center gap-2 p-1 bg-white rounded-lg border border-gray-100 w-full">
      @if (isHttpUrl(faviconUrl())) {
        <img class="w-4 h-4 shrink-0 rounded-sm object-contain" [src]="faviconUrl()" alt="" />
      } @else {
        <span class="text-base shrink-0">🔗</span>
      }
      <div class="flex flex-col min-w-0 gap-0.5 flex-1">
        <span class="text-xs text-gray-900 tracking-wide font-bold">URL</span>
        <span class="text-sm text-gray-800 break-all" #urlPreviewEl>{{ url() }}</span>
      </div>
      @if (url()) {
        <dz-copy-button [text]="url()" [highlightEl]="urlPreviewEl" />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class UrlBarComponent {
  readonly url = input.required<string>();

  protected readonly isHttpUrl = isHttpUrl;
  protected readonly faviconUrl = computed(() => FaviconHelper.getGoogleUrl(this.url(), 32));
}
