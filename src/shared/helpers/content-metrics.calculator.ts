import type {
  ContentStats,
  ReadabilityLabel,
  TopPhrase,
  StopWordEntry,
} from '../models/content-analysis-data.model';

// ── Tokenisation ────────────────────────────────────────────────────────────

/** Splits text into word tokens (letters + digits, supports Cyrillic/Latin) */
export const tokenize = (text: string): string[] =>
  (text.match(/[\p{L}\p{N}]+/gu) ?? []).map(w => w.toLowerCase());

/** Returns true when token consists entirely of digits */
export const isNumericToken = (token: string): boolean => /^\d+$/.test(token);

// ── Syllable counting ───────────────────────────────────────────────────────

const CYRILLIC_VOWELS = new Set('аеёиоуыэюяАЕЁИОУЫЭЮЯ');

/** Approximate syllable count — vowels for Cyrillic, standard heuristic for Latin */
export const countSyllables = (word: string): number => {
  if (!word) return 0;
  const isCyrillic = /[Ѐ-ӿ]/.test(word);
  if (isCyrillic) {
    const count = [...word].filter(c => CYRILLIC_VOWELS.has(c)).length;
    return Math.max(1, count);
  }
  // Latin heuristic
  const w = word.toLowerCase().replace(/e$/, '');
  const matches = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, matches?.length ?? 1);
};

// ── Sentence splitting ──────────────────────────────────────────────────────

/**
 * Splits text into sentences. Avoids splitting on common abbreviations
 * and decimal numbers (e.g. "3.14", "Dr. Smith").
 */
export const splitSentences = (text: string): string[] => {
  // Replace decimal numbers temporarily
  const protected_ = text.replace(/(\d)\.(\d)/g, '$1DOTDECIMAL$2');
  // Split on . ! ? followed by whitespace + capital or end-of-string
  const parts = protected_
    .split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z"'«])|(?<=[.!?])\s*$/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  return parts.length > 0 ? parts : [text];
};

// ── Readability ─────────────────────────────────────────────────────────────

export const fleschReadingEase = (
  totalWords: number,
  totalSentences: number,
  totalSyllables: number
): number => {
  if (totalWords === 0 || totalSentences === 0) return 0;
  const asl = totalWords / totalSentences;
  const asw = totalSyllables / totalWords;
  return Math.round((206.835 - 1.015 * asl - 84.6 * asw) * 100) / 100;
};

export const fleschKincaidGrade = (
  totalWords: number,
  totalSentences: number,
  totalSyllables: number
): number => {
  if (totalWords === 0 || totalSentences === 0) return 0;
  const asl = totalWords / totalSentences;
  const asw = totalSyllables / totalWords;
  return Math.round((0.39 * asl + 11.8 * asw - 15.59) * 100) / 100;
};

export const gunningFog = (
  totalWords: number,
  totalSentences: number,
  complexWords: number
): number => {
  if (totalWords === 0 || totalSentences === 0) return 0;
  const asl = totalWords / totalSentences;
  const pct = complexWords / totalWords;
  return Math.round(0.4 * (asl + 100 * pct) * 100) / 100;
};

export const readabilityLabel = (score: number): ReadabilityLabel => {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Confusing';
};

// ── N-grams ─────────────────────────────────────────────────────────────────

/**
 * Generates n-grams from an array of per-sentence token arrays.
 * N-grams do NOT cross sentence boundaries.
 */
export const buildNgrams = (sentenceTokens: string[][], n: number): Map<string, number> => {
  const freq = new Map<string, number>();
  for (const tokens of sentenceTokens) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n).join(' ');
      freq.set(gram, (freq.get(gram) ?? 0) + 1);
    }
  }
  return freq;
};

/** Converts frequency map to sorted TopPhrase array */
export const freqMapToTopPhrases = (
  freq: Map<string, number>,
  totalDenominator: number,
  stopWordSet: Set<string>
): TopPhrase[] => {
  const entries = [...freq.entries()].sort(([a, ca], [b, cb]) =>
    cb !== ca ? cb - ca : a.localeCompare(b)
  );
  return entries.map(([phrase, count]) => ({
    phrase,
    count,
    percent: totalDenominator > 0 ? Math.round((count / totalDenominator) * 10000) / 100 : 0,
    isStopWord: stopWordSet.has(phrase) || isNumericToken(phrase),
  }));
};

// ── Main calculator ─────────────────────────────────────────────────────────

export interface ComputeInput {
  text: string;
  stopWordSet: Set<string>;
}

export interface ComputeResult {
  stats: ContentStats;
  top1: TopPhrase[];
  top2: TopPhrase[];
  top3: TopPhrase[];
  stopWords: StopWordEntry[];
}

export const computeContentMetrics = ({ text, stopWordSet }: ComputeInput): ComputeResult => {
  if (!text.trim()) {
    const empty: ContentStats = {
      totalWords: 0,
      uniqueWords: 0,
      uniqueWordsPercent: 0,
      stopWordsCount: 0,
      stopWordsPercent: 0,
      waterPercent: 0,
      avgSentenceLength: 0,
      readabilityScore: 0,
      readabilityLabel: 'Standard',
      charsNoSpaces: 0,
      fleschKincaid: 0,
      gunningFog: 0,
      lowConfidence: true,
    };
    return { stats: empty, top1: [], top2: [], top3: [], stopWords: [] };
  }

  // Characters (no spaces/newlines)
  const charsNoSpaces = text.replace(/\s/g, '').length;

  // Sentences
  const sentences = splitSentences(text);
  const sentenceCount = Math.max(1, sentences.length);

  // Tokenize per sentence (preserves sentence boundaries for n-grams)
  const sentenceTokens = sentences.map(s => tokenize(s));
  const allTokens = sentenceTokens.flat();
  const totalWords = allTokens.length;

  if (totalWords === 0) {
    const empty: ContentStats = {
      totalWords: 0,
      uniqueWords: 0,
      uniqueWordsPercent: 0,
      stopWordsCount: 0,
      stopWordsPercent: 0,
      waterPercent: 0,
      avgSentenceLength: 0,
      readabilityScore: 0,
      readabilityLabel: 'Standard',
      charsNoSpaces,
      fleschKincaid: 0,
      gunningFog: 0,
      lowConfidence: true,
    };
    return { stats: empty, top1: [], top2: [], top3: [], stopWords: [] };
  }

  // Unique words
  const uniqueWordSet = new Set(allTokens);
  const uniqueWords = uniqueWordSet.size;

  // Stop words + water — single pass
  const stopWordFreq = new Map<string, number>();
  let stopWordsCount = 0;
  let waterTokens = 0;
  for (const token of allTokens) {
    const isStop = stopWordSet.has(token) || isNumericToken(token);
    if (isStop) {
      stopWordsCount++;
      stopWordFreq.set(token, (stopWordFreq.get(token) ?? 0) + 1);
    }
    if (isStop || token.length === 1) waterTokens++;
  }
  const waterPercent = Math.round((waterTokens / totalWords) * 10000) / 100;

  // Syllables
  let totalSyllables = 0;
  let complexWords = 0;
  for (const token of allTokens) {
    const s = countSyllables(token);
    totalSyllables += s;
    if (s >= 3) complexWords++;
  }

  // Readability scores
  const fre = fleschReadingEase(totalWords, sentenceCount, totalSyllables);
  const fk = fleschKincaidGrade(totalWords, sentenceCount, totalSyllables);
  const gf = gunningFog(totalWords, sentenceCount, complexWords);

  const stats: ContentStats = {
    totalWords,
    uniqueWords,
    uniqueWordsPercent: Math.round((uniqueWords / totalWords) * 10000) / 100,
    stopWordsCount,
    stopWordsPercent: Math.round((stopWordsCount / totalWords) * 10000) / 100,
    waterPercent,
    avgSentenceLength: Math.round((totalWords / sentenceCount) * 100) / 100,
    readabilityScore: fre,
    readabilityLabel: readabilityLabel(fre),
    charsNoSpaces,
    fleschKincaid: fk,
    gunningFog: gf,
    lowConfidence: totalWords < 50,
  };

  // N-grams
  const freq1Raw = buildNgrams(sentenceTokens, 1);
  const freq1 = new Map(
    [...freq1Raw.entries()].filter(([w]) => !stopWordSet.has(w) && !isNumericToken(w))
  );
  const freq2 = buildNgrams(sentenceTokens, 2);
  const freq3 = buildNgrams(sentenceTokens, 3);

  const totalBigrams = [...freq2.values()].reduce((a, b) => a + b, 0);
  const totalTrigrams = [...freq3.values()].reduce((a, b) => a + b, 0);

  const top1 = freqMapToTopPhrases(freq1, totalWords, new Set());
  const top2 = freqMapToTopPhrases(freq2, totalBigrams, new Set());
  const top3 = freqMapToTopPhrases(freq3, totalTrigrams, new Set());

  // Stop words table
  const stopWords: StopWordEntry[] = [...stopWordFreq.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([word, count]) => ({
      word,
      count,
      percent: Math.round((count / totalWords) * 10000) / 100,
      isNumber: isNumericToken(word),
    }));

  return { stats, top1, top2, top3, stopWords };
};
