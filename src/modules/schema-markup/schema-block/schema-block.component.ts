import type { SchemaBlock } from '../../../shared/models/schema-data.model';
import { CopyButtonComponent } from '../../ui/copy-button/copy-button.component';
import { Component, input, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-schema-block',
  imports: [CopyButtonComponent, TranslocoDirective],
  templateUrl: './schema-block.component.html',
  host: { class: 'flex flex-col w-full' },
})
export class SchemaBlockComponent {
  readonly block = input.required<SchemaBlock>();

  protected readonly showRaw = signal(false);

  protected toggleRaw(): void {
    this.showRaw.update(v => !v);
  }

  protected dotClass(status: string): string {
    if (status === 'ok') return 'bg-green-500';
    if (status === 'warning') return 'bg-orange-400';
    return 'bg-red-400';
  }

  protected badgeClass(status: string): string {
    if (status === 'ok') return 'bg-green-100 text-green-700';
    if (status === 'warning') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-600';
  }

  protected get headerDotClass(): string {
    const s = this.block().overallStatus;
    if (s === 'valid') return 'bg-green-500';
    if (s === 'has-warnings') return 'bg-orange-400';
    return 'bg-red-400';
  }

  protected get headerBadge(): { labelKey: string; cls: string } {
    const s = this.block().overallStatus;
    if (s === 'valid')
      return { labelKey: 'social.schema.status_valid', cls: 'bg-green-100 text-green-700' };
    if (s === 'has-warnings')
      return {
        labelKey: 'social.schema.status_has_warnings',
        cls: 'bg-orange-100 text-orange-700',
      };
    if (s === 'broken')
      return { labelKey: 'social.schema.status_broken', cls: 'bg-red-100 text-red-600' };
    return { labelKey: 'social.schema.status_has_errors', cls: 'bg-red-100 text-red-600' };
  }
}
