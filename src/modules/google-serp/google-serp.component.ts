import { ICONS } from '../comon/constants/icons.const';
import { CHROME_COMMAND_ENUM } from '../comon/enums/chrome-command.enum';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';

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

  public ngOnInit(): void {
    if (chrome.runtime) {
      chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.SCRAP_CURRENT_TAB,
      });
    }
  }
}
