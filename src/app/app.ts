import { ROUTES } from '../modules/comon/constants/routes.const';
import { TitleIfTruncatedDirective } from '../modules/comon/directives/title-if-truncated.directive';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'dz-root',
  imports: [RouterOutlet, RouterLink, TranslocoDirective, TitleIfTruncatedDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
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
    { route: ROUTES.SEO_AUDIT, labelKey: 'nav.seo_audit', emoji: '🔍' },
    { route: ROUTES.CURRENT_SITE, labelKey: 'nav.current_site', emoji: '🌐' },
    { route: ROUTES.HEADINGS, labelKey: 'nav.headings', emoji: '📑' },
    { route: ROUTES.PERFORMANCE, labelKey: 'nav.performance', emoji: '⚡' },
    { route: ROUTES.OG, labelKey: 'nav.og', emoji: '🔗' },
    { route: ROUTES.SCHEMA, labelKey: 'nav.schema', emoji: '🧩' },
    { route: ROUTES.CONTENT, labelKey: 'nav.content', emoji: '📝' },
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
