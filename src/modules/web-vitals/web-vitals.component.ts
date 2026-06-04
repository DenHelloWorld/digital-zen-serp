import { TabActivityService } from '../comon/services/tab-activity.service';
import { WebVitalsStore } from '../comon/stores/web-vitals.store';
import { LoadingBarComponent } from '../ui/loading-bar/loading-bar.component';
import { SpeedometerComponent } from '../ui/speedometer/speedometer.component';
import { UrlBarComponent } from '../ui/url-bar/url-bar.component';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

interface MetricDef {
  key: 'fcp' | 'lcp' | 'cls' | 'tbt' | 'speedIndex';
  labelKey: string;
  descKey: string;
  unit: string;
  decimals: number;
  good: number;
  poor: number;
}

const METRICS: MetricDef[] = [
  {
    key: 'fcp',
    labelKey: 'performance.fcp',
    descKey: 'performance.fcp_desc',
    unit: 'ms',
    decimals: 0,
    good: 1800,
    poor: 3000,
  },
  {
    key: 'lcp',
    labelKey: 'performance.lcp',
    descKey: 'performance.lcp_desc',
    unit: 'ms',
    decimals: 0,
    good: 2500,
    poor: 4000,
  },
  {
    key: 'cls',
    labelKey: 'performance.cls',
    descKey: 'performance.cls_desc',
    unit: '',
    decimals: 3,
    good: 0.1,
    poor: 0.25,
  },
  {
    key: 'tbt',
    labelKey: 'performance.tbt',
    descKey: 'performance.tbt_desc',
    unit: 'ms',
    decimals: 0,
    good: 200,
    poor: 600,
  },
  {
    key: 'speedIndex',
    labelKey: 'performance.speed_index',
    descKey: 'performance.speed_index_desc',
    unit: 'ms',
    decimals: 0,
    good: 3400,
    poor: 5800,
  },
];

@Component({
  selector: 'dz-web-vitals',
  imports: [
    TranslocoDirective,
    SpeedometerComponent,
    UrlBarComponent,
    LoadingBarComponent,
    DatePipe,
  ],
  templateUrl: './web-vitals.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'dz-web-vitals p-[var(--spacing)] flex flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class WebVitalsComponent {
  protected readonly store = inject(WebVitalsStore);
  protected readonly tabActivity = inject(TabActivityService);
  protected readonly metrics = METRICS;
  protected readonly strategies = [
    { value: 'mobile' as const, icon: '📱' },
    { value: 'desktop' as const, icon: '🖥️' },
  ];

  protected readonly vitalsData = computed(() => this.store.vitalsData());
  protected readonly isLoading = computed(() => this.store.isLoading());
  protected readonly error = computed(() => this.store.error());
  protected readonly strategy = computed(() => this.store.strategy());
  protected readonly source = computed(() => this.store.vitalsData()?.source ?? null);
  protected readonly errorCode = computed(() => this.store.vitalsData()?.errorCode ?? null);

  protected refresh(): void {
    this.store.loadVitals();
  }

  protected setStrategy(s: 'mobile' | 'desktop'): void {
    this.store.setStrategy(s);
  }
}
