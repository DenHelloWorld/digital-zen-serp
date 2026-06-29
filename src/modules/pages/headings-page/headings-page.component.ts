import { HeadingsComponent } from '../../headings/headings.component';
import { Component } from '@angular/core';

@Component({
  selector: 'dz-headings-page',
  imports: [HeadingsComponent],
  template: ` <dz-headings /> `,
  host: {
    class: 'w-full flex flex-col items-center',
  },
})
export class HeadingsPageComponent {}
