/**
 * HEADING_TAGS — список всех тегов заголовков.
 */
export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * TAG_COLORS — маппинг тега заголовка в цвет подсветки.
 * Экспортируется для использования в UI (цветовые плашки рядом с кнопками).
 */
export const TAG_COLORS: Record<string, string> = {
  h1: '#ef4444',
  h2: '#3b82f6',
  h3: '#22c55e',
  h4: '#f97316',
  h5: '#a855f7',
  h6: '#6b7280',
};

/**
 * HIGHLIGHTER_STATUS_CONFIG — цвета пульсатора для каждого статуса фичи.
 * dot — основной цвет точки, ping — цвет эффекта пульсации.
 * Ключи соответствуют HighlighterStatus ('idle' | 'ok' | 'warning' | 'error').
 */
export const HIGHLIGHTER_STATUS_CONFIG = {
  idle: { dot: undefined, ping: undefined },
  ok: { dot: '#22c55e', ping: '#4ade80' },
  warning: { dot: '#eab308', ping: '#facc15' },
  error: { dot: '#ef4444', ping: '#f87171' },
} as const;

/**
 * Интерфейс конфига, передаваемого в injected-функцию.
 */
export interface HeadingHighlighterConfig {
  enabled: boolean;
  selectedTags: Record<string, boolean>;
}

/**
 * Функция, которая выполняется в контексте веб-страницы через
 * chrome.scripting.executeScript. Находит заголовки по тегам,
 * добавляет outline + badge.
 *
 * @remarks Должна быть полностью самодостаточной (без внешних зависимостей),
 * т.к. сериализуется и выполняется в изолированном контексте страницы.
 *
 * @returns Объект с количеством найденных заголовков (h1-h6) на странице.
 */
export function applyHeadingHighlights(config: HeadingHighlighterConfig): {
  headingsFound: number;
} {
  const TAG_COLORS_MAP: Record<string, string> = {
    h1: '#ef4444',
    h2: '#3b82f6',
    h3: '#22c55e',
    h4: '#f97316',
    h5: '#a855f7',
    h6: '#6b7280',
  };

  // Считаем ВСЕ заголовки на странице (независимо от выбранных тегов)
  const totalHeadings = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).reduce((sum, tag) => {
    return sum + document.querySelectorAll(tag).length;
  }, 0);

  // Удаляем все предыдущие подсветки
  document.querySelectorAll('[data-dz-highlight]').forEach(el => {
    const badge = el.querySelector('[data-dz-badge]');
    if (badge) badge.remove();
    el.removeAttribute('data-dz-highlight');
    const htmlEl = el as HTMLElement;
    htmlEl.style.outline = '';
    htmlEl.style.outlineOffset = '';
    htmlEl.style.position = '';
  });

  if (!config.enabled) return { headingsFound: totalHeadings };

  for (const [tag, active] of Object.entries(config.selectedTags)) {
    if (!active) continue;

    const color = TAG_COLORS_MAP[tag] || '#6b7280';
    document.querySelectorAll(tag).forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.setAttribute('data-dz-highlight', tag);
      htmlEl.style.outline = `2px solid ${color}`;
      htmlEl.style.outlineOffset = '2px';
      htmlEl.style.position = 'relative';

      const badge = document.createElement('span');
      badge.setAttribute('data-dz-badge', '');
      badge.textContent = `[${tag.toUpperCase()}]`;
      badge.style.cssText = [
        'position:absolute',
        'top:-14px',
        'left:0',
        'font-size:10px',
        'font-weight:bold',
        'color:white',
        `background:${color}`,
        'padding:0 4px',
        'border-radius:2px',
        'line-height:14px',
        'z-index:2147483647',
        'pointer-events:none',
        'font-family:sans-serif',
      ].join(';');
      htmlEl.appendChild(badge);
    });
  }

  return { headingsFound: totalHeadings };
}
