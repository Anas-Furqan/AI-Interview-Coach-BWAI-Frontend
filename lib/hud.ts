import { HudMetrics } from '@/components/interview/types';

const EN_FILLERS = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'right', 'just'];
const UR_FILLERS = ['haan', 'matlab', 'jese', 'bas', 'acha', 'yani'];
const ACTION_VERBS = [
  'led', 'built', 'scaled', 'delivered', 'reduced', 'improved', 'launched', 'designed',
  'managed', 'increased', 'created', 'developed', 'optimized', 'drove', 'achieved', 'implemented'
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function countPhraseOccurrences(text: string, phrase: string): number {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  return (text.match(regex) || []).length;
}

export function computeHudMetrics(params: {
  transcript: string;
  startedAt: number;
  lastChangeAt: number;
  languageCode: string;
}): HudMetrics {
  const normalized = params.transcript.toLowerCase().trim();
  const words = normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const fillers = params.languageCode.startsWith('ur') ? UR_FILLERS : EN_FILLERS;
  const fillerCount = fillers.reduce((sum, word) => sum + countPhraseOccurrences(normalized, word), 0);
  const actionVerbCount = words.reduce((sum, word) => sum + (ACTION_VERBS.includes(word) ? 1 : 0), 0);

  const elapsedMinutes = Math.max((Date.now() - params.startedAt) / 60000, 1 / 60);
  const wpm = Math.round(wordCount / elapsedMinutes);

  let confidenceScore =
    100 - Math.min(fillerCount * 3, 40) - (wpm > 180 ? 15 : 0) - (wpm < 80 && wordCount > 20 ? 10 : 0) +
    Math.min(actionVerbCount * 2, 20) + (wordCount > 60 ? 5 : 0);
  confidenceScore = clamp(Math.round(confidenceScore), 0, 100);

  const actionVerbDensity = wordCount ? Math.round((actionVerbCount / wordCount) * 100) : 0;

  const restartPattern = /(\b\w+\b\s+\b\w+\b)\s*\.\.\.\s*\1/i.test(normalized);
  const fragmentedThought = (normalized.match(/,|\.\.\./g) || []).length > 5 && wordCount <= 20;
  const silenceGap = (Date.now() - params.lastChangeAt) / 1000 > 4;

  return {
    fillerCount,
    wpm,
    confidenceScore,
    actionVerbDensity,
    panicFlag: restartPattern || fragmentedThought || silenceGap,
  };
}
