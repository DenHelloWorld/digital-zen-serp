import { ROUTES } from '../modules/comon/constants/routes.const';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'dz-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #router = inject(Router);
  readonly #transloco = inject(TranslocoService);
  readonly #destroyRef = inject(DestroyRef);

  protected readonly currentUrl = signal(this.#router.url);
  protected readonly activeLang = signal(this.#transloco.getActiveLang());

  protected readonly routes = ROUTES;
  protected readonly languages = [
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  ] as const;
  protected readonly tabs = [
    { route: ROUTES.SEO_AUDIT, labelKey: 'nav.seo_audit' },
    { route: ROUTES.CURRENT_SITE, labelKey: 'nav.current_site' },
    { route: ROUTES.HEADINGS, labelKey: 'nav.headings' },
    { route: ROUTES.PERFORMANCE, labelKey: 'nav.performance' },
    { route: ROUTES.SOCIAL, labelKey: 'nav.social' },
  ] as const;

  constructor() {
    const routerSub = this.#router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
      }
    });
    this.#destroyRef.onDestroy(() => routerSub.unsubscribe());

    const langSub = this.#transloco.langChanges$.subscribe(lang => this.activeLang.set(lang));
    this.#destroyRef.onDestroy(() => langSub.unsubscribe());
  }

  protected setLang(lang: string) {
    if (lang === this.activeLang()) return;
    this.#transloco.setActiveLang(lang);
  }

  protected closePanel() {
    window.parent.postMessage({ command: 'CLOSE_PANEL' }, '*');
  }
}
