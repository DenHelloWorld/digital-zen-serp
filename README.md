# Digital Zen SERP

Chrome Extension (MV3) for SEO professionals — injected side panel with heading tree, Google SERP preview, SEO audit, Web Vitals, OG/Social preview, Schema Markup validation, and Content Analysis.

## Features

- **Google SERP Preview** — live title/description/URL preview with character bar indicators
- **SEO Audit** — meta tags, Open Graph, structured data, canonical, robots
- **Heading Tree** — H1–H6 hierarchy with validation and in-page highlight toggle
- **Web Vitals** — Lighthouse score, CrUX field data, opportunities, page screenshot (mobile + desktop)
- **OG & Social** — Open Graph / Twitter Card tags; link preview simulator (Google, Facebook, Twitter, Telegram, LinkedIn, Slack, Pinterest); bot-side fetch via Microlink API
- **Schema Markup** — JSON-LD / Microdata / RDFa extraction; per-field validation for 10+ schema.org types; collapsible raw JSON viewer
- **Content Analysis** — word count, unique words, water %, readability scores (Flesch RE, Flesch-Kincaid, Gunning Fog); top 1/2/3-gram frequency table; stop-word breakdown (EN/RU/ES/UK); full-page or main-content extraction mode

## Stack

Angular 22 · zoneless + signals · Tailwind CSS v4 · esbuild · Chrome MV3 · Transloco (en/ru)

## Getting started

```bash
npm install
npm run build:prod      # → dist/SERP/
```

Load unpacked extension in `chrome://extensions` → point to `dist/SERP/`.

For development (Angular dev server only, no extension APIs):

```bash
npm start
```

## PageSpeed API key

Without a key the extension uses the free quota (may be rate-limited).

1. [Google Cloud Console](https://console.cloud.google.com) → Create project → Enable **PageSpeed Insights API** → Credentials → Create API Key
2. Create `.env` in the repo root:

```
PAGESPEED_API_KEY=AIzaSy...
```

The key is embedded at build time via `scripts/build-dual.js` and is not committed.

## Project structure

```
src/
  app/              # root component, hash-based routing, app config
  background/       # MV3 service worker — chrome.* handlers, PageSpeed fetch
  content.ts        # injected content script — Shadow DOM host + iframe toggle
  modules/
    comon/          # shared Angular: stores, services, DI tokens, UI helpers
    web-vitals/     # Performance tab component
    base-seo-audit/ # SEO Audit tab component
    headings/       # Headings tab component
    google-preview/ # Google Preview tab component
    og-social/      # OG & Social tab — link preview simulator, microlink bot fetch
    schema-markup/  # Schema Markup tab — JSON-LD/Microdata/RDFa validator
    content-analysis/ # Content Analysis tab — text stats, top words, stop words
    ui/             # shared UI components (speedometer, loading-bar, favicon, url-bar)
  shared/           # pure TS, no Angular deps — enums, models, helpers
scripts/
  build-dual.js     # Angular build + esbuild (background.ts + content.ts) → dist/SERP/
```

## How the panel works

Clicking the extension icon injects `content.js` into the page once. A Shadow DOM host with an `<iframe>` slides in from the right. The iframe loads `index.html` at `chrome-extension://` origin so all `chrome.*` APIs work normally. Subsequent icon clicks toggle the panel open/closed via `chrome.tabs.sendMessage`.

## Commands

```bash
npm run build:prod     # production build → dist/SERP/
npm run lint           # ESLint (0 warnings enforced)
npm run format         # Prettier
npm run check:cycles   # circular dependency check
ng test                # Vitest unit tests
```
