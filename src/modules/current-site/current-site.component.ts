import { GooglePreviewComponent } from '../google-preview/google-preview.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-current-site',
  imports: [GooglePreviewComponent],
  template: ` <dz-google-preview /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-full flex justify-center' },
})
export class CurrentSiteComponent {}
