import { HEADING_TAGS, TAG_COLORS } from '../../shared/helpers/heading-highlighter.helper';
import { HeadingHighlighterStore } from '../comon/stores/heading-highlighter.store';
import { ToggleComponent } from '../ui/toggle/toggle.component';
import { Component, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-heading-highlighter',
  imports: [TranslocoDirective, ToggleComponent],
  templateUrl: './heading-highlighter.component.html',
  host: {
    class:
      'flex flex-col gap-2 w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class HeadingHighlighterComponent {
  protected readonly store = inject(HeadingHighlighterStore);

  protected readonly tags = HEADING_TAGS;
  protected readonly tagColors = TAG_COLORS;
}
