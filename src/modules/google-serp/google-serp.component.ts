import { ICONS } from '../comon/constants/icons.const';
import { ScrapStore } from '../comon/stores/scrap.store';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';

@Component({
  selector: 'dz-google-serp',
  imports: [],
  templateUrl: './google-serp.component.html',
  styleUrl: './google-serp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-google-serp',
  },
})
export class GoogleSerpComponent implements OnInit {
  protected readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');
  protected readonly icons = ICONS;
  protected readonly store = inject(ScrapStore);

  public ngOnInit(): void {
    this.store.scrapCurrentTab();
  }
}
