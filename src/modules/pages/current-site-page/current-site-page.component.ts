import { GooglePreviewComponent } from '../../google-preview/google-preview.component';
import { Component } from '@angular/core';

@Component({
  selector: 'dz-current-site-page',
  imports: [GooglePreviewComponent],
  template: ` <dz-google-preview /> `,
  host: { class: 'w-full flex flex-col items-center' },
})
export class CurrentSitePageComponent {}
