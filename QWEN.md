# Digital Zen SERP — QWEN.md

## Project Overview

**Digital Zen SERP** — Chrome-расширение (Manifest V3) для SEO-специалистов. Side panel с инструментами анализа SERP, SEO-аудита и проверки заголовков (H1–H6).

**Стек:** Angular 21 (zoneless, signals) · Tailwind CSS v4 · Transloco (i18n) · Chrome Extensions MV3 · esbuild · Vitest · linkedom

**Архитектура:**

```
src/
  shared/                      # Перекрёстные типы, хелперы (и UI, и background)
    enums/                     # chrome-command, chrome-storage-key, focus-error
    models/                    # heading-data, seo-audit-data, google-preview-data, tab-info
    helpers/                   # json-ld, is-http-url, heading-parser, heading-highlighter,
                               #   page-heading-highlighter, serp-bar
    index.ts                   # barrel
  app/                         # Корневой компонент, маршрутизация, конфиг
  background/                  # Service Worker
    BackgroundService          # Command-handler pattern (Map<command, handler>)
    GooglePreviewService       # Извлечение метаданных через linkedom
    SeoAuditService            # Инжекция скрипта напрямую (без linkedom)
  modules/
    comon/                     # Angular-specific: constants, services, stores, helpers
    base-seo-audit/            # SeoAuditViewComponent (отображение SEO-аудита)
    current-tab-serp/          # SERP preview с активной вкладки
    heading-highlighter/       # Тогглы подсветки заголовков
    headings/                  # Таблица заголовков с валидацией
    manual-serp/               # Симулятор SERP (ручной ввод)
    site-audit-page/           # Агрегатор: SeoAuditView + HeadingHighlighter
    ui/                        # toggle component
scripts/
  build-dual.js                # Angular build + esbuild background → dist/SERP/
```

**Маршруты (hash-based, kebab-case):**

- `#/google-serp` — симулятор SERP-превью
- `#/current-site` — превью с текущей вкладки
- `#/seo-audit` — SEO-аудит + подсветка заголовков
- `#/headings` — таблица заголовков
- `#/social` — placeholder (соцсети)

## Building & Running

```bash
# Установка зависимостей
npm install

# Режим разработки
npm start                     # → http://localhost:4200

# Production-сборка расширения
npm run build:prod            # → dist/SERP/ (Angular + background.js)

# TypeScript check
tsc -p tsconfig.app.json --noEmit

# Загрузить в Chrome: chrome://extensions → Загрузить распакованное → dist/SERP/
```

## Testing

```bash
# Unit tests (Vitest)
ng test
```

## Code Quality

```bash
# Линтер (ESLint)
npm run lint

# Форматирование (Prettier)
npm run format

# Pre-commit (husky + lint-staged):
#   - ESLint (0 warnings) + Prettier check на *.ts, *.html
#   - Prettier check на *.scss
#   - tsc --noEmit на *.ts
```

## Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/) с scope:

**Типы:** `feat`, `fix`, `chore`, `refactor`, `style`, `docs`, `perf`, `test`
**Scopes:** `core`, `common`, `background`, `serp`

Пример: `refactor(core): extract shared layer and migrate to command handlers`

## Development Conventions

### Dependency Graph

```
src/shared/  ←── src/background/     (enums, models, helpers)
src/shared/  ←── src/modules/comon/  (то же самое)
src/shared/  ←── src/modules/*/      (helpers)
```

`background/` НЕ импортирует из `modules/comon/`. Все перекрёстные типы — через `src/shared/`.

### Angular & Components

- **Zoneless** (`provideZonelessChangeDetection()`), все компоненты — `OnPush`
- **Сигналы** (`signal`/`computed`) вместо RxJS Subjects; RxJS только для `Router.events` и `Transloco.langChanges$`
- Селекторы: `dz` prefix — компоненты `dz-kebab-case`
- Стили: SCSS + Tailwind CSS v4 (CSS-переменные в `_variables.scss`)

### State Management

- Сторы в `modules/comon/stores/` — сигналы внутри класса, readonly через `.asReadonly()`
- Единый `TabActivityService` — сторы реагируют через `effect(() => { tabActivity.activeTab(); loadXxx(); })`
- Ошибки валидации **внутри ноды данных** (например, `HeadingData.errors: HeadingErrorType[]`)
- `HeadingHighlighterStore.turnOff()` делегирует в `toggleHighlighter()` — одна точка входа для состояния

### UI

- **Тогглы:** `input[type=checkbox] + label.peer + after:` псевдоэлемент
- **Компактный UI:** `p-1`/`p-2`, `items-center`, чёрные жирные лейблы, `flex-row`
- **Иконки:** SVG-спрайты в `index.html`, класс `.dz-icon`

### SERP-бары (длины title/description/link)

Общий хелпер `shared/helpers/serp-bar.helper.ts` — функции `truncateText`, `getBarCount`, `getTitleColor`, `getDescriptionColor`, `getLinkColor`. Используются в `ManualSerpComponent` и `CurrentTabSerpComponent` через прямой импорт (не через `this.`).

### i18n

- `@jsverse/transloco` — два языка: `en` (дефолт) и `ru`
- Файлы: `public/assets/i18n/{en,ru}.json`
- Загрузка через `TranslocoHttpLoader` (fetch + Map-кэш)

### Background (Service Worker)

- `chrome.runtime.onMessage` → `Map<ChromeCommandType, HandlerFunction>` (command handler pattern)
- `sidePanel.open()` обрабатывается синхронно (вне очереди)
- Остальные команды — через serialized Promise queue
- **GooglePreviewService** — получает HTML через injected script, парсит linkedom
- **SeoAuditService** — injected script возвращает только нужные поля (без linkedom)
- **ChromeStorageService** — Promise API (callback-free)

### Список команд (CHROME_COMMAND_ENUM)

| Команда               | Описание                              |
| --------------------- | ------------------------------------- |
| `OPEN_SIDE_PANEL_APP` | Открыть side panel (user gesture)     |
| `SCRAPE_CURRENT_TAB`  | Извлечь метаданные с активной вкладки |
| `GET_ACTIVE_TAB`      | Получить информацию о вкладке         |
| `BASE_SEO_AUDIT`      | SEO-аудит страницы                    |
| `HIGHLIGHT_HEADERS`   | Подсветить заголовки H1-H6            |
| `PARSE_HEADINGS`      | Распарсить заголовки                  |

### DRY-принципы (после рефакторинга)

- `#getJsonLd()` — единый хелпер в `shared/helpers/json-ld.helper.ts`, используется GooglePreviewService и SeoAuditService
- SERP-bar функции — единый хелпер в `shared/helpers/serp-bar.helper.ts`
- `cleanUrl` + `cleanProtocol` — единый файл `comon/helpers/url.helper.ts`
- Page-injected функции отделены от Angular-кода: `page-heading-highlighter.ts` vs `heading-highlighter.helper.ts`
