import { GooglePreviewComponent } from '../../google-preview/google-preview.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-current-site-page',
  imports: [GooglePreviewComponent],
  template: ` <dz-google-preview /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-full flex flex-col items-center' },
})
export class CurrentSitePageComponent {}
