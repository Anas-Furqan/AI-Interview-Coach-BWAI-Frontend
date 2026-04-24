'use client';

import { Box, Chip, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { HudMetrics } from '@/components/interview/types';

interface SpeechHUDProps {
  metrics: HudMetrics;
  language: 'en' | 'ur';
}

const labels = {
  en: {
    title: 'Live Speech Intelligence HUD',
    confidence: 'Confidence',
    wpm: 'WPM',
    panic: 'Panic Detector',
    stable: 'Stable',
    detected: 'Detected',
  },
  ur: {
    title: 'لائیو اسپیچ انٹیلیجنس HUD',
    confidence: 'اعتماد',
    wpm: 'رفتار (WPM)',
    panic: 'پینک ڈیٹیکٹر',
    stable: 'مستحکم',
    detected: 'فعال',
  },
};

function getConfidenceColor(score: number) {
  if (score >= 70) return '#16a34a';
  if (score >= 45) return '#f59e0b';
  return '#dc2626';
}

export default function SpeechHUD({ metrics, language }: SpeechHUDProps) {
  const copy = labels[language];
  const confidenceColor = getConfidenceColor(metrics.confidenceScore);

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 2,
        background: 'linear-gradient(160deg, rgba(15,23,42,0.94), rgba(30,41,59,0.92))',
        color: '#f8fafc',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {copy.title}
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <Box sx={{ position: 'relative', width: 124, height: 124, display: 'grid', placeItems: 'center' }}>
          <svg width="124" height="124" viewBox="0 0 124 124">
            <circle cx="62" cy="62" r="50" stroke="rgba(255,255,255,0.16)" strokeWidth="10" fill="none" />
            <motion.circle
              cx="62"
              cy="62"
              r="50"
              stroke={confidenceColor}
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: metrics.confidenceScore / 100 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <Box sx={{ position: 'absolute', textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} sx={{ color: confidenceColor }}>
              {metrics.confidenceScore}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {copy.confidence}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ minWidth: 120 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {copy.wpm}
          </Typography>
          <Typography variant="h4" fontWeight={800}>
            {metrics.wpm}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {copy.panic}
          </Typography>
          <motion.div
            animate={metrics.panicFlag ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={metrics.panicFlag ? { duration: 0.85, repeat: Infinity } : { duration: 0.2 }}
          >
            <Chip
              label={metrics.panicFlag ? copy.detected : copy.stable}
              sx={{
                mt: 0.8,
                color: 'white',
                fontWeight: 700,
                bgcolor: metrics.panicFlag ? '#dc2626' : '#15803d',
              }}
            />
          </motion.div>
        </Box>
      </Stack>
    </Box>
  );
}
