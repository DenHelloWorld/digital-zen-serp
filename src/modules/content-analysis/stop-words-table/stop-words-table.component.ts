import type { StopWordEntry } from '../../../shared/models/content-analysis-data.model';
import { Component, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-stop-words-table',
  imports: [TranslocoDirective],
  templateUrl: './stop-words-table.component.html',
  host: { class: 'w-full flex flex-col' },
})
export class StopWordsTableComponent {
  readonly stopWords = input<StopWordEntry[] | null>(null);
}
