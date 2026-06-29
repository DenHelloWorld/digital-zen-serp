import { OgSocialComponent } from '../../og-social/og-social.component';
import { Component } from '@angular/core';

@Component({
  selector: 'dz-social-page',
  imports: [OgSocialComponent],
  template: `<dz-og-social />`,
  host: { class: 'w-full flex flex-col' },
})
export class SocialPageComponent {}
