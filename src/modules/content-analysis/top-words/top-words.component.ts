import type { TopPhrase, TopWordsTab } from '../../../shared/models/content-analysis-data.model';
import { Component, computed, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-top-words',
  imports: [TranslocoDirective],
  templateUrl: './top-words.component.html',
  host: { class: 'w-full flex flex-col gap-2' },
})
export class TopWordsComponent {
  readonly top1 = input<TopPhrase[] | null>(null);
  readonly top2 = input<TopPhrase[] | null>(null);
  readonly top3 = input<TopPhrase[] | null>(null);

  protected readonly activeTab = signal<TopWordsTab>(1);

  protected setTab(tab: TopWordsTab): void {
    this.activeTab.set(tab);
  }

  protected readonly rows = computed((): TopPhrase[] | null => {
    switch (this.activeTab()) {
      case 1:
        return this.top1();
      case 2:
        return this.top2();
      case 3:
        return this.top3();
    }
  });
}
