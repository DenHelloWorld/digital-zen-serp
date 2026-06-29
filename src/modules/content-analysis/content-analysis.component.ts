import type { ContentExtractionMode } from '../../shared/models/content-analysis-data.model';
import { ContentAnalysisStore } from '../comon/stores/content-analysis.store';
import { StopWordsTableComponent } from './stop-words-table/stop-words-table.component';
import { TextStatisticsComponent } from './text-statistics/text-statistics.component';
import { TopWordsComponent } from './top-words/top-words.component';
import { Component, OnInit, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-content-analysis',
  imports: [
    TranslocoDirective,
    TextStatisticsComponent,
    TopWordsComponent,
    StopWordsTableComponent,
  ],
  templateUrl: './content-analysis.component.html',
  host: { class: 'w-full flex flex-col gap-4 p-[var(--spacing)]' },
})
export class ContentAnalysisComponent implements OnInit {
  protected readonly store = inject(ContentAnalysisStore);

  ngOnInit(): void {
    if (!this.store.data()) {
      this.store.refresh();
    }
  }

  protected setMode(mode: ContentExtractionMode): void {
    this.store.setMode(mode);
  }
}
