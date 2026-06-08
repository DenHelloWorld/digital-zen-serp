import { isHttpUrl } from '../../../shared/helpers/is-http-url.helper';
import { FaviconHelper } from '../../comon/helpers/favicon.helper';
import { TabActivityService } from '../../comon/services/tab-activity.service';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

/** Resolves favicon with 4-stage fallback: /favicon.ico → tab → Google S2 → emoji */
@Component({
  selector: 'dz-favicon',
  template: `
    @if (src()) {
      <img
        class="w-full h-full object-contain"
        [src]="src()!"
        [attr.alt]="null"
        (error)="onError()"
      />
    } @else {
      <span class="text-base leading-none">🔗</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'inline-flex items-center justify-center rounded-sm bg-white border border-gray-200 overflow-hidden',
  },
})
export class FaviconComponent {
  readonly url = input<string>('');

  readonly #tabActivity = inject(TabActivityService);
  readonly #stage = signal(0);

  protected readonly src = computed((): string | null => {
    const stage = this.#stage();
    const url = this.url();
    const origin = this.#origin(url);

    // 0: Chrome tab favicon — best quality, already resolved to highest-res icon by Chrome
    if (stage === 0) {
      const tab = this.#tabActivity.activeTab()?.favIconUrl ?? '';
      return isHttpUrl(tab) ? tab : this.#next(url);
    }
    // 1: /favicon.ico — direct, reliable fallback
    if (stage === 1) return origin ? `${origin}/favicon.ico` : this.#s2(url);
    // 2: Google S2 service
    if (stage === 2) return this.#s2(url);
    // 3: emoji
    return null;
  });

  constructor() {
    effect(() => {
      this.url();
      this.#tabActivity.activeTab();
      this.#stage.set(0);
    });
  }

  protected onError(): void {
    this.#stage.update(s => s + 1);
  }

  #origin(url: string): string | null {
    try {
      return new URL(url).origin;
    } catch {
      return null;
    }
  }

  #s2(url: string): string | null {
    const s2 = FaviconHelper.getGoogleUrl(url, 64);
    return isHttpUrl(s2) ? s2 : null;
  }

  #next(url: string): string | null {
    return this.#s2(url);
  }
}
