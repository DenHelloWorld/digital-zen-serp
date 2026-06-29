import type { ContentStats } from '../../../shared/models/content-analysis-data.model';
import { SpeedometerComponent } from '../../ui/speedometer/speedometer.component';
import { Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

interface StatRow {
  labelKey: string;
  tipKey: string;
  unitKey: string;
  getValue: (s: ContentStats) => string | number;
  /** True for metrics that require sufficient text volume to be accurate */
  confidenceSensitive?: boolean;
}

const STAT_ROWS: StatRow[] = [
  {
    labelKey: 'content.metrics.total_words',
    tipKey: 'content.metrics.total_words_tip',
    unitKey: 'content.units.words',
    getValue: s => s.totalWords,
  },
  {
    labelKey: 'content.metrics.unique_words',
    tipKey: 'content.metrics.unique_words_tip',
    unitKey: 'content.units.words',
    getValue: s => s.uniqueWords,
  },
  {
    labelKey: 'content.metrics.unique_words_pct',
    tipKey: 'content.metrics.unique_words_pct_tip',
    unitKey: 'content.units.percent',
    getValue: s => s.uniqueWordsPercent,
  },
  {
    labelKey: 'content.metrics.stop_words_count',
    tipKey: 'content.metrics.stop_words_count_tip',
    unitKey: 'content.units.words',
    getValue: s => s.stopWordsCount,
  },
  {
    labelKey: 'content.metrics.stop_words_pct',
    tipKey: 'content.metrics.stop_words_pct_tip',
    unitKey: 'content.units.percent',
    getValue: s => s.stopWordsPercent,
  },
  {
    labelKey: 'content.metrics.avg_sentence',
    tipKey: 'content.metrics.avg_sentence_tip',
    unitKey: 'content.units.words_per_sentence',
    getValue: s => s.avgSentenceLength,
  },
  {
    labelKey: 'content.metrics.chars',
    tipKey: 'content.metrics.chars_tip',
    unitKey: 'content.units.chars',
    getValue: s => s.charsNoSpaces,
  },
  {
    labelKey: 'content.metrics.flesch_kincaid',
    tipKey: 'content.metrics.flesch_kincaid_tip',
    unitKey: 'content.units.grade',
    getValue: s => s.fleschKincaid,
    confidenceSensitive: true,
  },
  {
    labelKey: 'content.metrics.gunning_fog',
    tipKey: 'content.metrics.gunning_fog_tip',
    unitKey: 'content.units.index',
    getValue: s => s.gunningFog,
    confidenceSensitive: true,
  },
];

@Component({
  selector: 'dz-text-statistics',
  imports: [TranslocoDirective, SpeedometerComponent],
  templateUrl: './text-statistics.component.html',
  host: { class: 'w-full flex flex-col gap-3' },
})
export class TextStatisticsComponent {
  readonly stats = input<ContentStats | null>(null);

  protected readonly rows = STAT_ROWS;

  readonly readabilityInverted = computed(() => {
    const s = this.stats();
    return s ? 100 - s.readabilityScore : null;
  });

  protected readonly readabilityLabelClass = computed(() => {
    const s = this.stats()?.readabilityScore ?? -1;
    if (s >= 60) return 'text-green-600';
    if (s >= 30) return 'text-amber-500';
    return 'text-red-500';
  });
}
