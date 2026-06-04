# Digital Zen SERP

Angular 21 Chrome Extension (MV3) side panel for SEO/SERP analysis — heading tree, Google preview, SEO audit, Web Vitals.

**Stack:** Angular 21, zoneless + signals, Tailwind CSS v4, esbuild, linkedom, Transloco.

## Commands

```bash
npm start              # dev server
npm run build:prod     # production dual build → dist/SERP/
npm run lint
npm run format
```

## Architecture

```
src/
  app/          # config, routes (hash-based)
  background/   # Chrome MV3 service worker — imports only from shared/
  modules/      # feature modules + comon/ (Angular-only: stores, services, DI tokens)
  shared/       # pure TS, no Angular deps — enums, models, helpers
```

**Rules:**

- `background/` never imports from `modules/` or `app/` — only `shared/`
- No barrel `index.ts` — always explicit import paths

## Key patterns

**Angular (zoneless + signals)**

- All components: `ChangeDetectionStrategy.OnPush`
- Stores: private writable signals (`#field`), public readonly signals exposed via `.asReadonly()`
- RxJS only where Angular forces it (`Router.events`, `Transloco.langChanges$`)
- Two-way binding: `[ngModel]="sig()" (ngModelChange)="sig.set($event)"` — not `[(ngModel)]="sig()"`

**Chrome Extension**

- Background commands: `Map<Command, Handler>` pattern — one method per command, no monolithic switch-case
- `executeScript` functions must be fully self-contained — no imports, all constants inlined (serialized via `toString()`)
- `IS_CHROME_EXTENSION` InjectionToken guards all `chrome.*` calls in dev mode

## PageSpeed API key

Получить ключ: https://console.cloud.google.com → Create project → Enable **PageSpeed Insights API** → Credentials → Create API Key.

Положить в `.env` в корне (файл в `.gitignore`):

```
PAGESPEED_API_KEY=AIzaSy...
```

## Known issues

- `manual-serp` / `current-tab-serp` have duplicated bar/color/truncation logic → belongs in `shared/helpers/serp-bar.helper.ts`
- `ChromeStorageService` uses callback API in an async-first codebase
