import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, Grid, LinearProgress, Typography } from '@mui/material';

interface LiveSpeechHudProps {
  liveSpeechText: string;
  isRecording: boolean;
  languageCode: string;
}

interface HudMetrics {
  fillerCount: number;
  wpm: number;
  confidenceScore: number;
  actionVerbDensity: number;
  panicFlag: boolean;
}

const EN_FILLERS = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally'];
const UR_FILLERS = ['matlab', 'yaani', 'hmm', 'uh', 'um'];
const ACTION_VERBS = [
  'built', 'led', 'created', 'optimized', 'improved', 'implemented', 'launched', 'managed',
  'delivered', 'solved', 'designed', 'analyzed', 'collaborated', 'developed', 'automated'
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const countPhraseOccurrences = (text: string, phrase: string) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
};

const meterColor = (score: number): 'success' | 'warning' | 'error' => {
  if (score >= 70) return 'success';
  if (score >= 45) return 'warning';
  return 'error';
};

const LiveSpeechHud: React.FC<LiveSpeechHudProps> = ({ liveSpeechText, isRecording, languageCode }) => {
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [lastTranscriptChangeAt, setLastTranscriptChangeAt] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<HudMetrics>({
    fillerCount: 0,
    wpm: 0,
    confidenceScore: 0,
    actionVerbDensity: 0,
    panicFlag: false,
  });

  const normalizedText = liveSpeechText.toLowerCase().trim();

  const fillerWords = useMemo(() => {
    const lang = (languageCode || '').toLowerCase();
    if (lang.startsWith('ur')) return UR_FILLERS;
    return EN_FILLERS;
  }, [languageCode]);

  useEffect(() => {
    if (isRecording && recordingStartTime === null) {
      setRecordingStartTime(Date.now());
      setLastTranscriptChangeAt(Date.now());
    }
    if (!isRecording) {
      setRecordingStartTime(null);
      setLastTranscriptChangeAt(null);
      setMetrics({ fillerCount: 0, wpm: 0, confidenceScore: 0, actionVerbDensity: 0, panicFlag: false });
    }
  }, [isRecording, recordingStartTime]);

  useEffect(() => {
    if (isRecording) {
      setLastTranscriptChangeAt(Date.now());
    }
  }, [normalizedText, isRecording]);

  useEffect(() => {
    if (!isRecording || !recordingStartTime) return;

    const calculateMetrics = () => {
      const words = normalizedText ? normalizedText.split(/\s+/).filter(Boolean) : [];
      const wordCount = words.length;
      const elapsedMinutes = Math.max((Date.now() - recordingStartTime) / 60000, 1 / 60);

      const fillerCount = fillerWords.reduce((sum, phrase) => sum + countPhraseOccurrences(normalizedText, phrase), 0);
      const actionVerbCount = words.reduce((sum, word) => sum + (ACTION_VERBS.includes(word) ? 1 : 0), 0);
      const silenceSeconds = lastTranscriptChangeAt ? (Date.now() - lastTranscriptChangeAt) / 1000 : 0;

      const firstWords = words.slice(0, 6).join(' ');
      const hasRestartPattern =
        firstWords.length > 5 && normalizedText.includes(`${firstWords} ${firstWords}`);
      const fragmentedThought = (normalizedText.match(/,|\.\.\./g) || []).length > 5 && words.length <= 20;
      const panicFlag = silenceSeconds > 4 || hasRestartPattern || fragmentedThought;

      const wpm = Math.round(wordCount / elapsedMinutes);
      const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;
      const actionVerbDensity = wordCount > 0 ? (actionVerbCount / wordCount) * 100 : 0;

      const confidenceScore = clamp(
        Math.round(85 - fillerRatio * 120 + Math.min(12, actionVerbDensity * 0.9)),
        0,
        100
      );

      setMetrics({
        fillerCount,
        wpm,
        confidenceScore,
        actionVerbDensity: Math.round(actionVerbDensity),
        panicFlag,
      });
    };

    calculateMetrics();
    const intervalId = window.setInterval(calculateMetrics, 5000);
    return () => window.clearInterval(intervalId);
  }, [fillerWords, isRecording, lastTranscriptChangeAt, normalizedText, recordingStartTime]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 0.5 }}>Live Speech HUD</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Updates every 5 seconds while you are speaking.
        </Typography>

        <Grid container spacing={1.5}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Filler Words</Typography>
            <Typography variant="h6">{metrics.fillerCount}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">WPM</Typography>
            <Typography variant="h6">{metrics.wpm}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Confidence</Typography>
            <Typography variant="h6">{metrics.confidenceScore}%</Typography>
            <LinearProgress
              variant="determinate"
              value={metrics.confidenceScore}
              color={meterColor(metrics.confidenceScore)}
              sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Action Verb Density</Typography>
            <Typography variant="h6">{metrics.actionVerbDensity}%</Typography>
            <LinearProgress
              variant="determinate"
              value={clamp(metrics.actionVerbDensity, 0, 100)}
              color={meterColor(metrics.actionVerbDensity)}
              sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant="body2"
              color={metrics.panicFlag ? 'warning.main' : 'text.secondary'}
              sx={{ fontWeight: metrics.panicFlag ? 700 : 500 }}
            >
              {metrics.panicFlag ? "Take a breath - you're doing great." : 'Delivery looks steady.'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default LiveSpeechHud;