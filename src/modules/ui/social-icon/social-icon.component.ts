import { SocialPlatform } from '../../../shared/enums/social-platform.enum';
import { ICONS } from '../../comon/constants/icons.const';
import { Component, computed, input } from '@angular/core';

const BRAND_COLORS: Record<SocialPlatform, string> = {
  [SocialPlatform.Facebook]: '#1877F2',
  [SocialPlatform.Twitter]: '#14171A',
  [SocialPlatform.Telegram]: '#26A5E4',
  [SocialPlatform.LinkedIn]: '#0A66C2',
  [SocialPlatform.Slack]: '#4A154B',
  [SocialPlatform.Google]: '#4285F4',
  [SocialPlatform.Pinterest]: '#E60023',
};

const BRAND_ICONS: Record<SocialPlatform, string> = {
  [SocialPlatform.Facebook]: ICONS.SI_FACEBOOK,
  [SocialPlatform.Twitter]: ICONS.SI_TWITTER,
  [SocialPlatform.Telegram]: ICONS.SI_TELEGRAM,
  [SocialPlatform.LinkedIn]: ICONS.SI_LINKEDIN,
  [SocialPlatform.Slack]: ICONS.SI_SLACK,
  [SocialPlatform.Google]: ICONS.SI_GOOGLE,
  [SocialPlatform.Pinterest]: ICONS.SI_PINTEREST,
};

@Component({
  selector: 'dz-social-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.fill]="color()"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <use [attr.href]="href()" />
    </svg>
  `,
  host: { class: 'inline-flex shrink-0' },
})
export class SocialIconComponent {
  readonly platform = input.required<SocialPlatform>();
  readonly size = input<number>(16);

  protected readonly href = computed(() => BRAND_ICONS[this.platform()]);
  protected readonly color = computed(() => BRAND_COLORS[this.platform()]);
}
