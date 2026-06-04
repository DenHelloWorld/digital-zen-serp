import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'dz-loading-bar',
  template: `
    @if (visible()) {
      <div class="w-full h-1 rounded-full overflow-hidden bg-blue-100">
        <div class="h-full w-full loading-bar-shimmer"></div>
      </div>
    }
  `,
  styles: [
    `
      .loading-bar-shimmer {
        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 40%, #06b6d4 70%, #3b82f6 100%);
        background-size: 200% 100%;
        animation: shimmer 1.4s ease-in-out infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class LoadingBarComponent {
  readonly visible = input.required<boolean>();
}
