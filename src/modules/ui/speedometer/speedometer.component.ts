import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const CIRCUMFERENCE = 2 * Math.PI * 40; // ~251.33

@Component({
  imports: [DecimalPipe],
  selector: 'dz-speedometer',
  template: `
    <div class="flex flex-col items-center">
      <svg class="w-full h-auto" viewBox="0 0 100 100">
        <!-- Rotate so fill starts at 12 o'clock -->
        <g transform="rotate(-90 50 50)">
          <!-- Gray track -->
          <circle cx="50" cy="50" r="40" stroke="#e5e7eb" stroke-width="10" fill="none" />

          <!-- Color fill (achieved portion) -->
          <circle
            [attr.stroke]="fillColor()"
            [attr.stroke-dasharray]="CIRCUMFERENCE"
            [attr.stroke-dashoffset]="dashOffset()"
            cx="50"
            cy="50"
            r="40"
            stroke-width="10"
            fill="none"
            stroke-linecap="round"
          />
        </g>

        <!-- Center: value -->
        @if (value() !== null) {
          <text
            x="50"
            y="47"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#111827"
            font-size="10"
            font-weight="700"
            font-family="inherit"
            style="font-variant-numeric: tabular-nums;"
          >
            {{ value()! | number: (decimals() > 0 ? '1.0-' + decimals() : '1.0-0') }}
          </text>

          <!-- Unit -->
          @if (unit()) {
            <text
              x="50"
              y="57"
              text-anchor="middle"
              dominant-baseline="central"
              fill="#9ca3af"
              font-size="4.5"
              font-family="inherit"
            >
              {{ unit() }}
            </text>
          }
        } @else {
          <text
            x="50"
            y="47"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#9ca3af"
            font-size="10"
            font-family="inherit"
            style="animation: loadingPulse 1.5s ease-in-out infinite;"
          >
            …
          </text>
        }
      </svg>
    </div>
  `,
  styles: [
    `
      @keyframes loadingPulse {
        0%,
        100% {
          opacity: 0.3;
        }
        50% {
          opacity: 1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class SpeedometerComponent {
  readonly value = input<number | null>(null);
  readonly goodThreshold = input<number>(0);
  readonly poorThreshold = input<number>(1);
  readonly unit = input('');
  readonly decimals = input(0);

  protected readonly CIRCUMFERENCE = CIRCUMFERENCE;

  readonly #range = computed(
    () => this.poorThreshold() + (this.poorThreshold() - this.goodThreshold())
  );

  readonly #valuePct = computed(() => {
    const v = this.value();
    if (v === null) return 1; // empty
    return Math.min(v, this.#range()) / this.#range();
  });

  protected readonly dashOffset = computed(() => CIRCUMFERENCE * this.#valuePct());

  protected readonly status = computed(() => {
    const v = this.value();
    if (v === null) return 'na' as const;
    if (v <= this.goodThreshold()) return 'good' as const;
    if (v <= this.poorThreshold()) return 'needs_improvement' as const;
    return 'poor' as const;
  });

  protected readonly fillColor = computed(() => {
    switch (this.status()) {
      case 'good':
        return '#22c55e';
      case 'needs_improvement':
        return '#fb923c';
      case 'poor':
        return '#ef4444';
      default:
        return '#e5e7eb';
    }
  });
}
