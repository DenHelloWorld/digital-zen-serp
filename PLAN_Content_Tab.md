# План реализации: вкладка Content

Ветка: `feat/content-analysis-tab`

---

## Принятые решения (закрытые вопросы из ТЗ)

| #   | Вопрос                 | Решение                                                                                                                                                                                                         |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Water (redundancy)** | `(stopWordsCount + particlesCount) / totalWords * 100`. Particles — отдельный внутренний список вспомогательных слов (союзы, предлоги, местоимения) из стоп-слов же. Верифицируем вручную на тестовых страницах |
| 2   | **Слоги на кириллице** | Считаем гласные (`аеёиоуыьъэюяАЕЁИОУЫЬЪЭЮЯ`) как приближение к слогам. Метрики отображаются для любого языка с пометкой `(approx)`                                                                              |
| 3   | **Стоп-слова**         | Статичные JSON-файлы в `public/assets/stop-words/` (ru, en, es, uk). Написаны вручную ~150-300 слов на язык. Без npm-зависимостей                                                                               |
| 4   | **Лемматизация**       | Не делаем в MVP. Разные формы = разные слова                                                                                                                                                                    |
| 5   | **Числа в Stop Words** | Любой токен только из цифр → Stop Words с иконкой `#`                                                                                                                                                           |
| 6   | **iframe**             | Игнорируем, анализируем только основной документ                                                                                                                                                                |
| 7   | **UI таблиц**          | div + `grid-cols` (Tailwind), как в остальных компонентах. Без `<table>`, без библиотек                                                                                                                         |

---

## Архитектура

```
[User: переключает режим / кликает "Обновить"]
       ↓ chrome.runtime.sendMessage(ANALYZE_CONTENT, { mode })
[Background: ContentAnalysisService]
       ↓ executeScript → extractPageText(mode)   ← self-contained func
[Page DOM] → возвращает raw text
       ↓ computeMetrics(text, stopWords) в background
[Store: ContentAnalysisStore] → сигналы → компоненты
```

Стоп-слова загружаются в background один раз через `fetch()` при первом запросе и кешируются в памяти сервис-воркера.

---

## Файловая структура

```
public/assets/stop-words/
  en.json   ✅ готово
  ru.json   ✅ готово
  es.json   ✅ готово
  uk.json   ✅ готово

src/shared/models/
  content-analysis-data.model.ts   ✅ готово

src/shared/helpers/
  content-text-extractor.ts        # self-contained func для executeScript
  content-metrics.calculator.ts    # countSyllables, flesch, gunningFog, ngrams, ...

src/shared/enums/
  chrome-command.enum.ts           # + ANALYZE_CONTENT

src/background/
  content-analysis.service.ts      # executeScript + fetch stop-words + computeMetrics
  background-service.ts            # + handler для ANALYZE_CONTENT

src/modules/comon/stores/
  content-analysis.store.ts        # сигналы: data, mode, isLoading, error + refresh()

src/modules/comon/constants/
  routes.const.ts                  # + CONTENT: 'content'

src/modules/content-analysis/
  content-analysis.component.ts/.html          # корневой: sticky toggle + кнопка
  text-statistics/
    text-statistics.component.ts/.html         # блок 1: метрики с ⓘ
  top-words/
    top-words.component.ts/.html               # блок 2: 3 вкладки + список
  stop-words-table/
    stop-words-table.component.ts/.html        # блок 3: список стоп-слов

src/modules/pages/content-page/
  content-page.component.ts                   # route target (thin wrapper)

src/app/
  app.routes.ts                               # + маршрут CONTENT
  app.ts                                      # + таб в навигации

public/assets/i18n/
  en.json                                     # + секция "content"
  ru.json                                     # + секция "content"
```

---

## Порядок шагов

| #   | Шаг                                                            | Статус                       |
| --- | -------------------------------------------------------------- | ---------------------------- |
| 1   | Модели + стоп-слова JSON                                       | ✅ готово                    |
| 2   | `content-text-extractor.ts` (self-contained для executeScript) | ✅ готово                    |
| 3   | `content-metrics.calculator.ts` (чистые функции)               | ✅ готово                    |
| 4   | `content-analysis.service.ts` в background                     | ✅ готово                    |
| 5   | Enum ANALYZE_CONTENT + регистрация handler                     | ✅ готово                    |
| 6   | `ContentAnalysisStore`                                         | ✅ готово                    |
| 7   | Компоненты + route + nav tab + i18n                            | ✅ готово                    |
| 8   | Edge-cases, пустые состояния, skeleton, tooltips               | ✅ готово (в составе шага 7) |

---

## Ключевые ограничения

- `content-text-extractor.ts` — функции **без импортов**, все константы инлайнятся (требование `executeScript`)
- Store авто-загружается только при переходе на вкладку Content (не при каждом `tabActivity`) — анализ тяжёлый
- n-граммы не пересекают границы предложений (`.!?` = разделитель)
- Скроллируемые блоки Top Words / Stop Words: `overflow-y-auto max-h-[240px]` на обёртке
