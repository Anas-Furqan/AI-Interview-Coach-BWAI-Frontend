export interface HudMetrics {
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillerRate: number;
  confidenceScore: number;
  panicDetected: boolean;
  starStatus: {
    hasSituation: boolean;
    hasTask: boolean;
    hasAction: boolean;
    hasResult: boolean;
  };
}

export interface HudAnalyticsInput {
  transcript: string;
  startedAt: number;
  lastChangeAt: number;
  languageCode: string;
}

const EN_FILLER_REGEX = /\b(um+|uh+|like|basically|actually|you\s+know|i\s+mean|right|so)\b/gi;
const UR_FILLER_REGEX = /\b(matlab|yaani|yani|acha|achha|haan+|jee|bas|jese|jaise|toh?)\b|[آا]چھا|یعنی|مطلب|ہاں/gi;
const STAR_SIGNAL_REGEX = {
  situation: /\b(situation|background|context|when\s+i\s+was|at\s+my\s+previous\s+role)\b/i,
  task: /\b(task|responsib|goal|objective|challenge)\b/i,
  action: /\b(action|i\s+(implemented|led|built|created|designed|resolved|optimized|collaborated|executed))\b/i,
  result: /\b(result|outcome|impact|improved|increased|reduced|delivered|achieved|learned)\b/i,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function countMatches(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function computeHudMetrics(input: HudAnalyticsInput): HudMetrics {
  const normalized = input.transcript.trim().toLowerCase();
  const words = normalized.length ? normalized.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const elapsedMinutes = Math.max((Date.now() - input.startedAt) / 60000, 1 / 60);
  const wpm = Math.round(wordCount / elapsedMinutes);

  const fillerRegex = input.languageCode.startsWith('ur') ? UR_FILLER_REGEX : EN_FILLER_REGEX;
  const fillerCount = countMatches(normalized, fillerRegex);
  const fillerRate = wordCount > 0 ? Math.round((fillerCount / wordCount) * 100) : 0;

  const longSilence = (Date.now() - input.lastChangeAt) / 1000 >= 4;
  const fragmentation = (normalized.match(/\.\.\.|--|,,/g) || []).length >= 2;
  const panicDetected = longSilence || (wpm > 185 && fillerRate >= 12) || fragmentation;

  const speakingPacePenalty = wpm > 175 ? 12 : wpm < 85 && wordCount >= 20 ? 8 : 0;
  const fillerPenalty = Math.min(fillerRate * 2, 40);
  const panicPenalty = panicDetected ? 12 : 0;
  const baseScore = 100 - speakingPacePenalty - fillerPenalty - panicPenalty;

  const confidenceScore = clamp(Math.round(baseScore), 0, 100);
  const starStatus = detectStarNudge(normalized);

  return {
    wordCount,
    wpm,
    fillerCount,
    fillerRate,
    confidenceScore,
    panicDetected,
    starStatus,
  };
}

export function detectStarNudge(answer: string): {
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  needsNudge: boolean;
} {
  const normalized = answer.trim().toLowerCase();

  const hasSituation = STAR_SIGNAL_REGEX.situation.test(normalized);
  const hasTask = STAR_SIGNAL_REGEX.task.test(normalized);
  const hasAction = STAR_SIGNAL_REGEX.action.test(normalized);
  const hasResult = STAR_SIGNAL_REGEX.result.test(normalized);

  return {
    hasSituation,
    hasTask,
    hasAction,
    hasResult,
    needsNudge: !(hasSituation && hasTask && hasAction && hasResult),
  };
}
