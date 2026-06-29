/// <reference types="chrome"/>
import { computeContentMetrics } from '../shared/helpers/content-metrics.calculator';
import { extractFullText, extractMainText } from '../shared/helpers/content-text-extractor';
import type {
  ContentAnalysisData,
  ContentExtractionMode,
} from '../shared/models/content-analysis-data.model';

const LANGUAGES = ['en', 'ru', 'es', 'uk'] as const;

export class ContentAnalysisService {
  #stopWordSet: Set<string> | null = null;

  async #loadStopWords(): Promise<Set<string>> {
    if (this.#stopWordSet) return this.#stopWordSet;

    const base = chrome.runtime.getURL('assets/stop-words/');
    const lists = await Promise.all(
      LANGUAGES.map(lang => fetch(`${base}${lang}.json`).then(r => r.json() as Promise<string[]>))
    );

    this.#stopWordSet = new Set(lists.flat().map(w => w.toLowerCase()));
    return this.#stopWordSet;
  }

  async analyze(tabId: number, mode: ContentExtractionMode): Promise<ContentAnalysisData> {
    const func = mode === 'main' ? extractMainText : extractFullText;

    const results = await chrome.scripting.executeScript({ target: { tabId }, func });
    const extracted = results[0]?.result;
    if (!extracted) throw new Error('INJECTION_FAILED');

    const stopWordSet = await this.#loadStopWords();
    const metrics = computeContentMetrics({ text: extracted.text, stopWordSet });

    return {
      ...metrics,
      mode,
      mainContentFallback: extracted.mainContentFallback,
    };
  }
}
