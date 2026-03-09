import { ScrapStore } from '../comon/stores/scrap.store';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-current-tab-serp',
  imports: [TranslocoDirective],
  templateUrl: './current-tab-serp.component.html',
  styleUrl: './current-tab-serp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-current-tab-serp',
  },
})
export class CurrentTabSerpComponent implements OnInit {
  protected readonly store = inject(ScrapStore);

  protected readonly currentTab = computed(() => this.store.currentTabScrap);

  public ngOnInit(): void {
    this.store.scrapCurrentTab();
  }
}
