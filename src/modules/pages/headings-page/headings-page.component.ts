import { HeadingsComponent } from '../../headings/headings.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-headings-page',
  imports: [HeadingsComponent],
  template: ` <dz-headings /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'w-full flex flex-col items-center',
  },
})
export class HeadingsPageComponent {}
