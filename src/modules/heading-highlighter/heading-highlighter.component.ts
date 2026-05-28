import { HEADING_TAGS, TAG_COLORS } from '../../shared/helpers/heading-highlighter.helper';
import { HeadingHighlighterStore } from '../comon/stores/heading-highlighter.store';
import { ToggleComponent } from '../ui/toggle/toggle.component';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

  protected readonly tags = HEADING_TAGS;
  protected readonly tagColors = TAG_COLORS;
}
