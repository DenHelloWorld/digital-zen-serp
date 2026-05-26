import { ROUTES } from '../modules/comon/constants/routes.const';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

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

  protected readonly currentUrl = toSignal(
    this.#router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.#router.url }
  );

  protected readonly routes = ROUTES;
  protected readonly languages = [
    { code: 'en', flag: '🇺🇸', label: 'English' },
    { code: 'ru', flag: '🇷🇺', label: 'Русский' },
  ] as const;
  protected readonly activeLang = toSignal(this.#transloco.langChanges$, {
    initialValue: this.#transloco.getActiveLang(),
  });

  protected setLang(lang: string) {
    if (lang === this.activeLang()) return;
    this.#transloco.setActiveLang(lang);
  }
}
