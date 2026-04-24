'use client';

import { Box, Chip, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { HudMetrics } from '@/components/interview/types';

interface SpeechHUDProps {
  metrics: HudMetrics;
  language: 'en' | 'ur';
  nudgeText?: string;
}

const labels = {
  en: {
    title: 'Live Speech Intelligence HUD',
    confidence: 'Confidence',
    wpm: 'WPM',
    panic: 'Panic Detector',
    stable: 'Stable',
    detected: 'Detected',
    star: 'STAR Progress',
    situation: 'S',
    task: 'T',
    action: 'A',
    result: 'R',
    nudgeTitle: 'STAR Tip:',
  },
  ur: {
    title: 'لائیو اسپیچ انٹیلیجنس HUD',
    confidence: 'اعتماد',
    wpm: 'رفتار (WPM)',
    panic: 'پینک ڈیٹیکٹر',
    stable: 'مستحکم',
    detected: 'فعال',
    star: 'STAR پیشرفت',
    situation: 'S',
    task: 'T',
    action: 'A',
    result: 'R',
    nudgeTitle: 'STAR مشورہ:',
  },
};

function getConfidenceColor(score: number) {
  if (score >= 70) return '#16a34a';
  if (score >= 45) return '#f59e0b';
  return '#dc2626';
}

export default function SpeechHUD({ metrics, language, nudgeText }: SpeechHUDProps) {
  const copy = labels[language];
  const confidenceColor = getConfidenceColor(metrics.confidenceScore);

  return (
    <Box
      className="glass-card"
      sx={{
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--glass-border)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${confidenceColor}, transparent)`,
          opacity: 0.5
        }
      }}
    >
      <motion.div
        initial={false}
        animate={metrics.starStatus.needsNudge && nudgeText ? { height: 'auto', opacity: 1, marginBottom: 20 } : { height: 0, opacity: 0, marginBottom: 0 }}
        style={{ overflow: 'hidden' }}
      >
        <Box
          sx={{
            background: 'rgba(59, 130, 246, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>
            {copy.nudgeTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {nudgeText}
          </Typography>
        </Box>
      </motion.div>

      <Typography variant="h6" className="text-gradient" sx={{ mb: 3, fontWeight: 800 }}>
        {copy.title}
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center" justifyContent="space-between">
        <Box sx={{ position: 'relative', width: 140, height: 140, display: 'grid', placeItems: 'center' }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
            <motion.circle
              cx="70"
              cy="70"
              r="60"
              stroke={confidenceColor}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: metrics.confidenceScore / 100 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ 
                transform: 'rotate(-90deg)', 
                transformOrigin: '50% 50%',
                filter: `drop-shadow(0 0 8px ${confidenceColor}44)`
              }}
            />
          </svg>
          <Box sx={{ position: 'absolute', textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={900} sx={{ color: confidenceColor, textShadow: `0 0 20px ${confidenceColor}44` }}>
              {metrics.confidenceScore}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {copy.confidence}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={4} flex={1} justifyContent="space-around">
          <Box>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {copy.wpm}
            </Typography>
            <Typography variant="h3" fontWeight={900} className="text-gradient">
              {metrics.wpm}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {copy.panic}
            </Typography>
            <motion.div
              animate={metrics.panicFlag ? { scale: [1, 1.1, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : { scale: 1 }}
              transition={metrics.panicFlag ? { duration: 0.8, repeat: Infinity } : { duration: 0.2 }}
            >
              <Chip
                label={metrics.panicFlag ? copy.detected : copy.stable}
                sx={{
                  mt: 1,
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  height: 28,
                  background: metrics.panicFlag 
                    ? 'linear-gradient(135deg, #ef4444, #991b1b)' 
                    : 'linear-gradient(135deg, #10b981, #065f46)',
                  boxShadow: metrics.panicFlag ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
                }}
              />
            </motion.div>
          </Box>
        </Stack>

        <Box>
          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
            {copy.star}
          </Typography>
          <Stack direction="row" spacing={1}>
            {[
              { key: 'hasSituation', label: copy.situation },
              { key: 'hasTask', label: copy.task },
              { key: 'hasAction', label: copy.action },
              { key: 'hasResult', label: copy.result },
            ].map((step) => {
              const active = metrics.starStatus[step.key as keyof typeof metrics.starStatus];
              return (
                <motion.div
                  key={step.key}
                  animate={active ? { 
                    scale: [1, 1.2, 1], 
                    background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                    boxShadow: '0 0 15px rgba(99, 102, 241, 0.18)'
                  } : { 
                    scale: 1, 
                    background: 'rgba(255,255,255,0.05)' 
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    fontWeight: 900,
                    color: active ? 'white' : 'rgba(255,255,255,0.2)',
                    border: active ? 'none' : '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  {step.label}
                </motion.div>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
