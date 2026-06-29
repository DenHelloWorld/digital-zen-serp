import { WebVitalsCrux } from '../../shared/models/web-vitals-data.model';
import { TabActivityService } from '../comon/services/tab-activity.service';
import { WebVitalsStore } from '../comon/stores/web-vitals.store';
import { LoadingBarComponent } from '../ui/loading-bar/loading-bar.component';
import { SpeedometerComponent } from '../ui/speedometer/speedometer.component';
import { UrlBarComponent } from '../ui/url-bar/url-bar.component';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

interface MetricDef {
  key:
    | 'fcp'
    | 'lcp'
    | 'cls'
    | 'tbt'
    | 'inp'
    | 'ttfb'
    | 'tti'
    | 'speedIndex'
    | 'dnsLookup'
    | 'tcpConnect'
    | 'domInteractive'
    | 'domContentLoaded'
    | 'domComplete';
  labelKey: string;
  descKey: string;
  unit: string;
  decimals: number;
  good: number;
  poor: number;
  thresholds: string;
  cruxKey?: keyof WebVitalsCrux;
  localOnly?: boolean;
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
    thresholds: '≤1.8s · >3s',
    cruxKey: 'fcp',
  },
  {
    key: 'lcp',
    labelKey: 'performance.lcp',
    descKey: 'performance.lcp_desc',
    unit: 'ms',
    decimals: 0,
    good: 2500,
    poor: 4000,
    thresholds: '≤2.5s · >4s',
    cruxKey: 'lcp',
  },
  {
    key: 'inp',
    labelKey: 'performance.inp',
    descKey: 'performance.inp_desc',
    unit: 'ms',
    decimals: 0,
    good: 200,
    poor: 500,
    thresholds: '≤200ms · >500ms',
    cruxKey: 'inp',
  },
  {
    key: 'cls',
    labelKey: 'performance.cls',
    descKey: 'performance.cls_desc',
    unit: '',
    decimals: 3,
    good: 0.1,
    poor: 0.25,
    thresholds: '≤0.1 · >0.25',
    cruxKey: 'cls',
  },
  {
    key: 'tbt',
    labelKey: 'performance.tbt',
    descKey: 'performance.tbt_desc',
    unit: 'ms',
    decimals: 0,
    good: 200,
    poor: 600,
    thresholds: '≤200ms · >600ms',
  },
  {
    key: 'ttfb',
    labelKey: 'performance.ttfb',
    descKey: 'performance.ttfb_desc',
    unit: 'ms',
    decimals: 0,
    good: 800,
    poor: 1800,
    thresholds: '≤800ms · >1.8s',
  },
  {
    key: 'tti',
    labelKey: 'performance.tti',
    descKey: 'performance.tti_desc',
    unit: 'ms',
    decimals: 0,
    good: 3800,
    poor: 7300,
    thresholds: '≤3.8s · >7.3s',
  },
  {
    key: 'dnsLookup',
    labelKey: 'performance.dns_lookup',
    descKey: 'performance.dns_lookup_desc',
    unit: 'ms',
    decimals: 0,
    good: 20,
    poor: 100,
    thresholds: '≤20ms · >100ms',
    localOnly: true,
  },
  {
    key: 'tcpConnect',
    labelKey: 'performance.tcp_connect',
    descKey: 'performance.tcp_connect_desc',
    unit: 'ms',
    decimals: 0,
    good: 20,
    poor: 100,
    thresholds: '≤20ms · >100ms',
    localOnly: true,
  },
  {
    key: 'domInteractive',
    labelKey: 'performance.dom_interactive',
    descKey: 'performance.dom_interactive_desc',
    unit: 'ms',
    decimals: 0,
    good: 2000,
    poor: 4000,
    thresholds: '≤2s · >4s',
    localOnly: true,
  },
  {
    key: 'domContentLoaded',
    labelKey: 'performance.dom_content_loaded',
    descKey: 'performance.dom_content_loaded_desc',
    unit: 'ms',
    decimals: 0,
    good: 2000,
    poor: 4000,
    thresholds: '≤2s · >4s',
    localOnly: true,
  },
  {
    key: 'domComplete',
    labelKey: 'performance.dom_complete',
    descKey: 'performance.dom_complete_desc',
    unit: 'ms',
    decimals: 0,
    good: 3500,
    poor: 6000,
    thresholds: '≤3.5s · >6s',
    localOnly: true,
  },
  {
    key: 'speedIndex',
    labelKey: 'performance.speed_index',
    descKey: 'performance.speed_index_desc',
    unit: 'ms',
    decimals: 0,
    good: 3400,
    poor: 5800,
    thresholds: '≤3.4s · >5.8s',
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
    DecimalPipe,
  ],
  templateUrl: './web-vitals.component.html',
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
    { value: 'mobile' as const, label: '📱' },
    { value: 'desktop' as const, label: '🖥️' },
  ];

  protected readonly vitalsData = computed(() => this.store.vitalsData());
  protected readonly isLoading = computed(() => this.store.isLoading());
  protected readonly error = computed(() => this.store.error());
  protected readonly strategy = computed(() => this.store.strategy());

  /** 100 - score passed to speedometer ring (higher score = less fill offset). */
  protected readonly invertedScore = computed(() => {
    const s = this.store.vitalsData()?.score;
    return s != null ? 100 - s : null;
  });

  protected readonly score = computed(() => this.store.vitalsData()?.score ?? null);
  protected readonly filmstrip = computed(() => this.store.vitalsData()?.filmstrip ?? null);
  protected readonly isLocal = computed(() => this.store.vitalsData()?.source === 'local');
  protected readonly opportunities = computed(() => this.store.vitalsData()?.opportunities ?? null);

  protected refresh(): void {
    this.store.loadVitals();
  }

  protected setStrategy(s: 'mobile' | 'desktop'): void {
    this.store.setStrategy(s);
  }
}
