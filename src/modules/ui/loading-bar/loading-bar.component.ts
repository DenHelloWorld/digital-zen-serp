import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dz-loading-bar',
  template: `
    @if (visible()) {
      <div class="w-full h-0.5 bg-blue-200 rounded animate-pulse"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class LoadingBarComponent {
  readonly visible = input.required<boolean>();
}
