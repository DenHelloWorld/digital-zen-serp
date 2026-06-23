import { SocialPlatform } from '../../../shared/enums/social-platform.enum';
import type { MetaTag } from '../../../shared/models/og-data.model';
import { SocialIconComponent } from '../../ui/social-icon/social-icon.component';
import { FacebookCardComponent } from './cards/facebook-card/facebook-card.component';
import { GoogleCardComponent } from './cards/google-card/google-card.component';
import { LinkedinCardComponent } from './cards/linkedin-card/linkedin-card.component';
import { PinterestCardComponent } from './cards/pinterest-card/pinterest-card.component';
import { SlackCardComponent } from './cards/slack-card/slack-card.component';
import { TelegramCardComponent } from './cards/telegram-card/telegram-card.component';
import { TwitterCardComponent } from './cards/twitter-card/twitter-card.component';
import type { PreviewCardData } from './preview-card-data.model';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-link-preview-simulator',
  imports: [
    TranslocoDirective,
    SocialIconComponent,
    FacebookCardComponent,
    TwitterCardComponent,
    TelegramCardComponent,
    LinkedinCardComponent,
    SlackCardComponent,
    GoogleCardComponent,
    PinterestCardComponent,
  ],
  templateUrl: './link-preview-simulator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-4 w-full' },
})
export class LinkPreviewSimulatorComponent {
  readonly tags = input.required<MetaTag[]>();

  protected readonly P = SocialPlatform;

  private get(key: string): string | null {
    return this.tags().find(t => t.key === key)?.value ?? null;
  }

  private get domain(): string {
    const url = this.get('og:url') ?? this.get('canonical');
    if (!url) return '';
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  protected readonly ogData = computed<PreviewCardData>(() => ({
    title: this.get('og:title') ?? this.get('title'),
    description: this.get('og:description') ?? this.get('description'),
    image: this.get('og:image'),
    domain: this.domain,
  }));

  protected readonly twitterData = computed<PreviewCardData>(() => ({
    title: this.get('twitter:title') ?? this.get('og:title') ?? this.get('title'),
    description:
      this.get('twitter:description') ?? this.get('og:description') ?? this.get('description'),
    image: this.get('twitter:image') ?? this.get('og:image'),
    domain: this.domain,
  }));
}
