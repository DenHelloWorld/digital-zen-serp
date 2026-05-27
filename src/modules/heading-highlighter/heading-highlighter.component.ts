import { IS_CHROME_EXTENSION } from '../comon/constants/chrome-runtime.token';
import { HEADING_TAGS, TAG_COLORS } from '../comon/helpers/heading-highlighter.helper';
import { HeadingHighlighterStore } from '../comon/stores/heading-highlighter.store';
import { ToggleComponent } from '../ui/toggle/toggle.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-heading-highlighter',
  imports: [TranslocoDirective, ToggleComponent],
  templateUrl: './heading-highlighter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-heading-highlighter flex flex-col gap-2 px-[var(--spacing)]',
  },
})
export class HeadingHighlighterComponent {
  protected readonly store = inject(HeadingHighlighterStore);
  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #destroyRef = inject(DestroyRef);

  protected readonly tags = HEADING_TAGS;
  protected readonly tagColors = TAG_COLORS;

  constructor() {
    this.#listenToTabChanges();
  }

  #listenToTabChanges(): void {
    if (!this.#isChrome) return;

    const onActivated = () => this.store.reapply();
    const onUpdated = (_tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete') {
        this.store.reapply();
      }
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);

    this.#destroyRef.onDestroy(() => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    });
  }
}
