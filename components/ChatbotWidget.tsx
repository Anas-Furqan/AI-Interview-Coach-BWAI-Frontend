'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
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
  const pathname = usePathname();
  const { language } = useInterviewContext();
  const isInterviewPage = pathname.startsWith('/interview');
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
            title: 'AI Assistant',
            placeholder: 'Ask a question',
            thinking: 'Typing...',
            intro: 'Hi! I am your interview assistant. Ask me about preparation, STAR answers, or role-specific tips.',
            fallback: 'The assistant is temporarily unavailable. Please try again in a moment.',
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  if (isInterviewPage) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open AI assistant"
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-5 right-5 z-[1400] inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400/95 text-slate-950 shadow-[0_18px_36px_rgba(15,23,42,0.32)] transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      >
        {isOpen ? <CloseRoundedIcon /> : <ChatRoundedIcon />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-24 right-5 z-[1400] w-[min(100vw-1.5rem,22rem)] max-h-[72vh] rounded-[28px] border border-slate-500/30 bg-slate-950/90 p-0 shadow-2xl shadow-slate-950/30 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3 rounded-t-[28px] bg-slate-900/90 px-4 py-3 backdrop-blur-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">AI Assistant</p>
                <h2 className="mt-1 text-sm font-semibold text-slate-100">Here to help with FAQs and interview prep.</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-200 transition hover:bg-slate-700"
                aria-label="Close assistant"
              >
                <CloseRoundedIcon fontSize="small" />
              </button>
            </div>

            <div className="flex h-[calc(72vh-164px)] flex-col gap-3 overflow-hidden px-4 py-3 sm:h-[420px]">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[84%] rounded-3xl border px-4 py-3 text-sm leading-6 ${
                        message.role === 'user'
                          ? 'bg-cyan-400/15 text-slate-100 border-cyan-300/20'
                          : 'bg-slate-800/90 text-slate-200 border-slate-700/80'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300 delay-75" />
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300 delay-150" />
                    <span>{strings.thinking}</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="border-t border-slate-700/60 bg-slate-950/90 px-4 py-3">
              <label htmlFor="chat-input" className="sr-only">
                {strings.placeholder}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="chat-input"
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  placeholder={strings.placeholder}
                  className="min-h-[46px] flex-1 rounded-2xl border border-slate-700/80 bg-slate-900/95 px-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <SendRoundedIcon />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
