import { SchemaMarkupComponent } from '../../schema-markup/schema-markup.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-schema-og-page',
  imports: [SchemaMarkupComponent],
  template: `<dz-schema-markup />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-full flex flex-col' },
})
export class SchemaOgPageComponent {}
