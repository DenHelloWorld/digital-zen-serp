export type ContentExtractionMode = 'full' | 'main';

export interface ContentStats {
  totalWords: number;
  uniqueWords: number;
  uniqueWordsPercent: number;
  stopWordsCount: number;
  stopWordsPercent: number;
  waterPercent: number;
  avgSentenceLength: number;
  readabilityScore: number;
  readabilityLabel: ReadabilityLabel;
  charsNoSpaces: number;
  fleschKincaid: number;
  gunningFog: number;
  /** True when text is too short for reliable readability scores (<50 words) */
  lowConfidence: boolean;
}

export type ReadabilityLabel =
  | 'Very Easy'
  | 'Easy'
  | 'Fairly Easy'
  | 'Standard'
  | 'Fairly Difficult'
  | 'Difficult'
  | 'Very Confusing';

export interface TopPhrase {
  phrase: string;
  count: number;
  percent: number;
  /** True when the phrase is a single stop word */
  isStopWord: boolean;
}

export type TopWordsTab = 1 | 2 | 3;

export interface StopWordEntry {
  word: string;
  count: number;
  percent: number;
  /** True when the token consists only of digits */
  isNumber: boolean;
}

export interface ContentAnalysisData {
  stats: ContentStats;
  /** Top 1-grams sorted by count desc */
  top1: TopPhrase[];
  /** Top 2-grams sorted by count desc */
  top2: TopPhrase[];
  /** Top 3-grams sorted by count desc */
  top3: TopPhrase[];
  stopWords: StopWordEntry[];
  mode: ContentExtractionMode;
  /** True when "main content" heuristic found no clear block and fell back to full page */
  mainContentFallback: boolean;
}
