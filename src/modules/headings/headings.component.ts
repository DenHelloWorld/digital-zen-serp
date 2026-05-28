import { HEADING_TAGS, TAG_COLORS } from '../../shared/helpers/heading-highlighter.helper';
import { HeadingsStore } from '../comon/stores/headings.store';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-headings',
  imports: [TranslocoDirective],
  templateUrl: './headings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-headings p-[var(--spacing)] flex flex-col gap-[var(--spacing)] w-full items-start',
  },
})
export class HeadingsComponent {
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
}
