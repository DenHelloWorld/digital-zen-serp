import type { SchemaBlock } from '../../shared/models/schema-data.model';
import { SchemaOgStore } from '../comon/stores/schema-og.store';
import { LoadingBarComponent } from '../ui/loading-bar/loading-bar.component';
import { SchemaBlockComponent } from './schema-block/schema-block.component';
import { Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-schema-markup',
  imports: [TranslocoDirective, LoadingBarComponent, SchemaBlockComponent],
  templateUrl: './schema-markup.component.html',
  host: {
    class:
      'dz-schema-markup p-[var(--spacing)] flex flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class SchemaMarkupComponent {
  readonly #store = inject(SchemaOgStore);

  protected readonly blocks = computed<SchemaBlock[]>(() => this.#store.schemaBlocks());
  protected readonly isLoading = computed(() => this.#store.loading());
  protected readonly error = computed(() => this.#store.error());

  protected refresh(): void {
    this.#store.load();
  }
}
