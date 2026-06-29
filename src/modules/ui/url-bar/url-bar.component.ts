import { CopyButtonComponent } from '../copy-button/copy-button.component';
import { FaviconComponent } from '../favicon/favicon.component';
import { Component, input } from '@angular/core';

@Component({
  selector: 'dz-url-bar',
  imports: [CopyButtonComponent, FaviconComponent],
  template: `
    <div class="flex items-center gap-2 p-1 bg-white rounded-lg border border-gray-100 w-full">
      <dz-favicon class="w-4 h-4 shrink-0" [url]="url()" />
      <div class="flex flex-col min-w-0 gap-0.5 flex-1">
        <span class="text-xs text-gray-900 tracking-wide font-bold">URL</span>
        <span class="text-sm text-gray-800 break-all" #urlPreviewEl>{{ url() }}</span>
      </div>
      @if (url()) {
        <dz-copy-button [text]="url()" [highlightEl]="urlPreviewEl" />
      }
    </div>
  `,
  host: { class: 'block w-full' },
})
export class UrlBarComponent {
  readonly url = input.required<string>();
}
