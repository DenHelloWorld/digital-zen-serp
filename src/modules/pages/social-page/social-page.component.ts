import { OgSocialComponent } from '../../og-social/og-social.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-social-page',
  imports: [OgSocialComponent],
  template: `<dz-og-social />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-full flex flex-col' },
})
export class SocialPageComponent {}
