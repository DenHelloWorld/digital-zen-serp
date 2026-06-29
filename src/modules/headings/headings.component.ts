import { CHROME_COMMAND_ENUM } from '../../shared/enums/chrome-command.enum';
import { HEADING_TAGS, TAG_COLORS } from '../../shared/helpers/heading-highlighter.helper';
import { IS_CHROME_EXTENSION } from '../comon/constants/chrome-runtime.token';
import { HeadingsStore } from '../comon/stores/headings.store';
import { HeadingHighlighterComponent } from '../heading-highlighter/heading-highlighter.component';
import { LoadingBarComponent } from '../ui/loading-bar/loading-bar.component';
import { Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-headings',
  imports: [TranslocoDirective, HeadingHighlighterComponent, LoadingBarComponent],
  templateUrl: './headings.component.html',
  host: {
    class:
      'dz-headings p-[var(--spacing)] flex flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class HeadingsComponent {
  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  protected readonly store = inject(HeadingsStore);

  protected readonly tags = HEADING_TAGS;
  protected readonly tagColors = TAG_COLORS;

  protected readonly headingsData = computed(() => this.store.headingsData());
  protected readonly isLoading = computed(() => this.store.isLoading());
  protected readonly error = computed(() => this.store.error());

  protected readonly isReady = computed(
    () => !this.isLoading() && !this.error() && this.headingsData()
  );

  protected refresh(): void {
    this.store.loadHeadings();
  }

  protected scrollToHeading(id: number, tagName: string): void {
    if (!this.#isChrome) return;
    try {
      chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.SCROLL_TO_HEADING,
        payload: { id, tagName },
      });
    } catch {
      /* background unavailable */
    }
  }
}
