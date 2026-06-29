# Digital Zen SERP

Angular 22 Chrome Extension (MV3) injected panel for SEO/SERP analysis — heading tree, Google preview, SEO audit, Web Vitals, Content Analysis.

Panel is injected into pages as a Shadow DOM iframe triggered by clicking the extension action icon. The Angular app runs inside the iframe at `chrome-extension://` origin, preserving full `chrome.*` API access.

**Stack:** Angular 22, zoneless + signals, Tailwind CSS v4, esbuild, linkedom, Transloco.

## Commands

```bash
npm start              # dev server
npm run build:prod     # production dual build → dist/SERP/
npm run lint
npm run format
npm run check:cycles   # circular dependency check (also runs in pre-commit)
```

## Architecture

```
src/
  app/          # config, routes (hash-based)
  background/   # Chrome MV3 service worker — imports only from shared/
  content.ts    # injected content script — Shadow DOM host + iframe toggle
  modules/      # feature modules + comon/ (Angular-only: stores, services, DI tokens)
  shared/       # pure TS, no Angular deps — enums, models, helpers
```

**Panel lifecycle:**

1. User clicks action icon → `chrome.action.onClicked` → `content.js` injected once per tab
2. Subsequent clicks send `TOGGLE_PANEL` message → CSS `translateX` transition
3. On open, `PANEL_OPENED` postMessage → `TabActivityService.refresh()` → stores re-check URL
4. On navigation (full reload) `chrome.tabs.onUpdated` clears injection state → fresh inject on next click

**Rules:**

- `background/` never imports from `modules/` or `app/` — only `shared/`
- No barrel `index.ts` — always explicit import paths

## Key patterns

**Angular (zoneless + signals)**

- Services/stores: `@Service()` decorator (Angular 22) — defaults to `providedIn: 'root'`
- Stores: private writable signals (`#field`), public readonly signals exposed via `.asReadonly()`
- RxJS only where Angular forces it (`Router.events`, `Transloco.langChanges$`)
- Two-way binding: `[ngModel]="sig()" (ngModelChange)="sig.set($event)"` — not `[(ngModel)]="sig()"`

**Chrome Extension**

- Background commands: `Map<Command, Handler>` pattern — one method per command, no monolithic switch-case
- All handlers run concurrently (no global queue) — each `chrome.runtime.onMessage` handler fires independently
- `executeScript` functions must be fully self-contained — no imports, all constants inlined (serialized via `toString()`)
- `IS_CHROME_EXTENSION` InjectionToken guards all `chrome.*` calls in dev mode
- `content.ts` built separately via esbuild (`--format=iife --external:chrome`) → `content.js`

## PageSpeed API key

Получить ключ: https://console.cloud.google.com → Create project → Enable **PageSpeed Insights API** → Credentials → Create API Key.

Положить в `.env` в корне (файл в `.gitignore`):

```
PAGESPEED_API_KEY=AIzaSy...
```

## Web Vitals / PageSpeed

`COLLECT_WEB_VITALS_BOTH` command fetches mobile + desktop sequentially in one background handler → single `chrome.runtime.sendMessage` round-trip. Results keyed by `${url}|${strategy}` in `WebVitalsStore`. Error results go to `#latest` (display-only, not cached) so the next panel open auto-retries.

## Content Analysis

`ANALYZE_CONTENT` command runs `executeScript` to extract page text, then computes metrics in the background worker via `ContentAnalysisService`:

- **Two modes**: `full` (entire body text) / `main` (main-content heuristic with fallback)
- **Stop words**: EN/RU/ES/UK word lists loaded from `public/assets/stop-words/*.json`, cached in-memory after first load
- **Metrics**: word count, unique words, water %, Flesch Reading Ease (clamped 0–100), Flesch-Kincaid, Gunning Fog, n-gram top words (1/2/3)
- **Skeleton loading**: `#data.set(null)` before fetch + `Promise.all([request, setTimeout(500)])` ensures minimum 500 ms skeleton; child components accept `null` inputs and render pulse rows

## Known issues

- `manual-serp` / `current-tab-serp` have duplicated bar/color/truncation logic → belongs in `shared/helpers/serp-bar.helper.ts`
