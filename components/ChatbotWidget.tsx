'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Fab,
  IconButton,
  Paper,
  TextField,
  Typography,
  CircularProgress,
  Divider,
} from '@mui/material';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatbotMessage } from '@/lib/api';
import { useInterviewContext } from '@/app/context/InterviewContext';

type ChatMessage = {
  role: 'user' | 'bot';
  text: string;
};

function buildSessionId(): string {
  return `site-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ChatbotWidget() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      text: 'Hi! I am your interview assistant. Ask me about preparation, STAR answers, or role-specific tips.',
    },
  ]);

  const strings = useMemo(
    () =>
      isUrdu
        ? {
            title: 'انٹرویو اسسٹنٹ',
            placeholder: 'اپنا سوال لکھیں',
            thinking: 'سوچ رہا ہے...',
            intro: 'السلام علیکم! میں آپ کا انٹرویو اسسٹنٹ ہوں۔ STAR جوابات، تیاری، اور رول اسپیسیفک ٹپس پوچھیں۔',
            fallback: 'اس وقت اسسٹنٹ دستیاب نہیں ہے۔ براہِ کرم دوبارہ کوشش کریں۔',
          }
        : {
            title: 'Interview Assistant',
            placeholder: 'Type your message',
            thinking: 'Thinking...',
            intro: 'Hi! I am your interview assistant. Ask me about preparation, STAR answers, or role-specific tips.',
            fallback: 'I could not reach the assistant right now. Please try again in a moment.',
          },
    [isUrdu]
  );

  useEffect(() => {
    setMessages(prev => {
      if (prev.length !== 1 || prev[0].role !== 'bot' || prev[0].text === strings.intro) {
        return prev;
      }
      return [{ role: 'bot', text: strings.intro }];
    });
  }, [strings.intro]);

  const effectiveSessionId = useMemo(() => sessionId || buildSessionId(), [sessionId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    if (!sessionId) {
      setSessionId(effectiveSessionId);
    }

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatbotMessage({
        message: trimmed,
        sessionId: effectiveSessionId,
        languageCode: isUrdu ? 'ur' : 'en',
      });

      if (!sessionId) {
        setSessionId(response.sessionId);
      }

      setMessages(prev => [...prev, { role: 'bot', text: response.reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: strings.fallback,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Fab
        color="secondary"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="toggle chatbot"
        sx={{
          position: 'fixed',
          bottom: { xs: 18, md: 28 },
          right: { xs: 18, md: 28 },
          zIndex: 1600,
          boxShadow: '0 16px 32px rgba(0,0,0,0.35)',
          background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
          color: '#0f172a',
          '&:hover': {
            background: 'linear-gradient(135deg, #38bdf8, #2dd4bf)',
          },
        }}
      >
        {isOpen ? <CloseRoundedIcon /> : <ChatRoundedIcon />}
      </Fab>

      <AnimatePresence>
        {isOpen && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            sx={{
              position: 'fixed',
              bottom: { xs: 84, md: 96 },
              right: { xs: 14, md: 24 },
              width: { xs: 'calc(100vw - 28px)', sm: 380 },
              maxHeight: { xs: '70vh', md: 540 },
              zIndex: 1600,
            }}
          >
            <Paper
              elevation={12}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                background: 'linear-gradient(160deg, rgba(15,23,42,0.96), rgba(30,41,59,0.96))',
              }}
            >
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {strings.title}
                </Typography>
                <IconButton size="small" onClick={() => setIsOpen(false)} aria-label="close chatbot">
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider />

              <Box sx={{ p: 1.5, height: { xs: 320, md: 380 }, overflowY: 'auto' }}>
                {messages.map((message, index) => (
                  <Box
                    key={`${message.role}-${index}`}
                    sx={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '86%',
                        px: 1.5,
                        py: 1,
                        borderRadius: 2,
                        fontSize: 14,
                        lineHeight: 1.45,
                        backgroundColor: message.role === 'user' ? 'rgba(14,165,233,0.24)' : 'rgba(51,65,85,0.7)',
                        border: '1px solid rgba(148,163,184,0.18)',
                      }}
                    >
                      {message.text}
                    </Box>
                  </Box>
                ))}
                {isLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, color: 'text.secondary' }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption">{strings.thinking}</Typography>
                  </Box>
                )}
              </Box>

              <Divider />
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1, p: 1.5 }}>
                <TextField
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  placeholder={strings.placeholder}
                  size="small"
                  fullWidth
                />
                <IconButton type="submit" color="primary" disabled={isLoading || !input.trim()} aria-label="send message">
                  <SendRoundedIcon />
                </IconButton>
              </Box>
            </Paper>
          </Box>
        )}
      </AnimatePresence>
    </>
  );
}
