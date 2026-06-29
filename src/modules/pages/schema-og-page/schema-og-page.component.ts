import { SchemaMarkupComponent } from '../../schema-markup/schema-markup.component';
import { Component } from '@angular/core';

@Component({
  selector: 'dz-schema-og-page',
  imports: [SchemaMarkupComponent],
  template: `<dz-schema-markup />`,
  host: { class: 'w-full flex flex-col' },
})
export class SchemaOgPageComponent {}
