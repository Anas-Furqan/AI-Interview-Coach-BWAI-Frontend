'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputBase,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  Toolbar,
  Typography,
  Stack,
  Alert,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8080').replace(/\/$/, '');

import {
  appendSessionQuestionMetric,
  createFirestoreSession,
  finalizeFirestoreSession,
  getStarNudge,
  getSummary,
  startSession,
  submitAnswer,
} from '@/lib/api';
import { computeHudMetrics } from '@/lib/hud';
import { Analysis, FinalAnalysis, HudMetrics, Message } from './types';
import SpeechHUD from '@/src/components/hud/SpeechHUD';
import LanguageToggle from './LanguageToggle';
import { useInterviewContext } from '@/app/context/InterviewContext';

interface JobsData {
  industries: Array<{ name: string; roles: string[] }>;
}

type UiMode = 'SETUP' | 'ACTIVE' | 'SUMMARY';

const defaultHud: HudMetrics = {
  fillerCount: 0,
  wpm: 0,
  confidenceScore: 0,
  actionVerbDensity: 0,
  panicFlag: false,
  starStatus: {
    hasSituation: false,
    hasTask: false,
    hasAction: false,
    hasResult: false,
    needsNudge: false,
  },
};

export default function InterviewDashboard() {
  const { user, selectedRole, language: appLanguage, setLanguage: setAppLanguage } = useInterviewContext();
  const [uiMode, setUiMode] = useState<UiMode>('SETUP');
  const [setupStep, setSetupStep] = useState(1);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lang, setLang] = useState<'en' | 'ur'>(appLanguage);

  useEffect(() => {
    if (uiMode === 'ACTIVE' && videoEnabled && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(err => console.error('Video feed error:', err));
    }
  }, [uiMode, videoEnabled]);

  const [jobsData, setJobsData] = useState<JobsData | null>(null);
  const [industry, setIndustry] = useState('');
  const [role, setRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  const [voiceData, setVoiceData] = useState<Record<string, any> | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState('English (US)');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [languageMap, setLanguageMap] = useState<Record<string, string>>({});

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [profileSummary, setProfileSummary] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [numExpQuestions, setNumExpQuestions] = useState(2);
  const [numRoleQuestions, setNumRoleQuestions] = useState(2);
  const [numPersonalityQuestions, setNumPersonalityQuestions] = useState(2);

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<Analysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [finalAnalysis, setFinalAnalysis] = useState<FinalAnalysis | null>(null);

  const [activePhase, setActivePhase] = useState('GREETING');
  const [cvText, setCvText] = useState('');
  const [userName, setUserName] = useState('Candidate');

  const [answer, setAnswer] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [hud, setHud] = useState<HudMetrics>(defaultHud);
  const [currentNudge, setCurrentNudge] = useState<string>('');
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [lastSpeechChangeAt, setLastSpeechChangeAt] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionCounter, setQuestionCounter] = useState(0);
  const [expQuestionsAsked, setExpQuestionsAsked] = useState(0);
  const [roleQuestionsAsked, setRoleQuestionsAsked] = useState(0);
  const [personalityQuestionsAsked, setPersonalityQuestionsAsked] = useState(0);

  const [questionMetrics, setQuestionMetrics] = useState<Array<{
    questionId: string;
    confidence: number;
    wpm: number;
    fillerCount: number;
    panic: boolean;
    starMissing: boolean;
    score: number;
    starStatus: {
      hasSituation: boolean;
      hasTask: boolean;
      hasAction: boolean;
      hasResult: boolean;
    };
    createdAt: string;
  }>>([]);
  const [videoSnapshots, setVideoSnapshots] = useState<string[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const copy = useMemo(
    () =>
      lang === 'ur'
        ? {
            stop: 'روکیں',
            listening: 'سن رہا ہے...',
            shareAnswer: 'اپنا جواب شیئر کریں',
            phase: 'مرحلہ',
            startInterview: 'انٹرویو شروع کریں',
            finalReport: 'آخری رپورٹ',
            overallScore: 'مجموعی اسکور',
            strengths: 'خوبیاں',
            improvements: 'بہتری کے نکات',
            startNewSession: 'نیا سیشن شروع کریں',
            nudgeLabel: 'STAR نَج',
            sessionSetup: 'سیشن سیٹ اپ',
            uploadCv: 'سی وی اپ لوڈ کریں (PDF)',
          }
        : {
            stop: 'Stop',
            listening: 'Listening...',
            shareAnswer: 'Share your answer',
            phase: 'Phase',
            startInterview: 'Start Interview',
            finalReport: 'Final Report',
            overallScore: 'Overall Score',
            strengths: 'Strengths',
            improvements: 'Areas for Improvement',
            startNewSession: 'Start New Session',
            nudgeLabel: 'STAR Nudge',
            sessionSetup: 'Session Setup',
            uploadCv: 'Upload CV (PDF)',
          },
    [lang]
  );

  const languageCode = useMemo(() => {
    if (lang === 'ur') return 'ur-PK';
    return languageMap[voiceLanguage] || 'en-US';
  }, [lang, voiceLanguage, languageMap]);

  useEffect(() => {
    setLang(appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    if (lang === 'ur') {
      setVoiceLanguage('Urdu (Pakistan)');
    } else {
      setVoiceLanguage('English (US)');
    }
  }, [lang]);

  useEffect(() => {
    fetch('/jobs.json')
      .then(res => res.json())
      .then((data: JobsData) => {
        setJobsData(data);
        const firstIndustry = data.industries[0];
        if (firstIndustry) {
          setIndustry(firstIndustry.name);
          setAvailableRoles(firstIndustry.roles);
          if (!selectedRole) {
            setRole(firstIndustry.roles[0]);
          }
        }
      })
      .catch(console.error);

    fetch('/voice.json')
      .then(res => res.json())
      .then((data: Record<string, any>) => {
        setVoiceData(data);
        const nextMap: Record<string, string> = {};
        Object.keys(data).forEach(key => {
          nextMap[key] = data[key].lang_code;
        });
        setLanguageMap(nextMap);
        const langKey = lang === 'ur' ? 'Urdu (Pakistan)' : 'English (US)';
        setVoiceLanguage(langKey);
      })
      .catch(console.error);

    if (selectedRole) {
      setRole(selectedRole);
    }
  }, [lang, selectedRole]);

  useEffect(() => {
    if (!voiceData || !voiceLanguage) return;
    const voices = voiceData[voiceLanguage]?.voices || {};
    const firstVoice = Object.values(voices)[0] as string | undefined;
    setSelectedVoice(firstVoice || '');
  }, [voiceData, voiceLanguage]);

  const availableVoices = useMemo(() => {
    if (!voiceData || !voiceLanguage) return {};
    return voiceData[voiceLanguage]?.voices || {};
  }, [voiceData, voiceLanguage]);

  const liveText = `${answer} ${interimTranscript}`.trim();

  useEffect(() => {
    if (!isRecording || !recordingStart || !lastSpeechChangeAt) {
      setHud(defaultHud);
      return;
    }
    const tick = () => {
      const computed = computeHudMetrics({
        transcript: liveText,
        startedAt: recordingStart,
        lastChangeAt: lastSpeechChangeAt,
        languageCode,
      });
      setHud(computed);

      if (computed.starStatus.needsNudge) {
        const missing = [];
        if (!computed.starStatus.hasSituation) missing.push(lang === 'ur' ? 'صورتحال (Situation)' : 'Situation');
        if (!computed.starStatus.hasTask) missing.push(lang === 'ur' ? 'کام (Task)' : 'Task');
        if (!computed.starStatus.hasAction) missing.push(lang === 'ur' ? 'عمل (Action)' : 'Action');
        if (!computed.starStatus.hasResult) missing.push(lang === 'ur' ? 'نتیجہ (Result)' : 'Result');

        if (missing.length > 0) {
          const msg = lang === 'ur'
            ? `آپ کے جواب میں ${missing.join(', ')} کی کمی محسوس ہو رہی ہے۔`
            : `Your answer is missing: ${missing.join(', ')}. Try to include it!`;
          setCurrentNudge(msg);
        }
      } else {
        setCurrentNudge('');
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [isRecording, liveText, recordingStart, lastSpeechChangeAt, languageCode]);

  const handleIndustryChange = (newIndustry: string) => {
    setIndustry(newIndustry);
    const selected = jobsData?.industries.find(item => item.name === newIndustry);
    if (selected) {
      setAvailableRoles(selected.roles);
      setRole(selected.roles[0]);
    }
  };

  const cleanupRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    if (isRecording) return;

    setIsRecording(true);
    setRecordingStart(Date.now());
    setLastSpeechChangeAt(Date.now());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      socketRef.current = new WebSocket(`${WS_BASE_URL}/stt`);

      socketRef.current.onopen = () => {
        socketRef.current?.send(JSON.stringify({ config: { languageCode } }));
      };

      socketRef.current.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        if (data.status === 'ready') {
          const options: MediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' };
          if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            delete options.mimeType;
          }

          mediaRecorderRef.current = new MediaRecorder(stream, options);
          mediaRecorderRef.current.ondataavailable = chunk => {
            if (chunk.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(chunk.data);
            }
          };
          mediaRecorderRef.current.start(500);
          return;
        }

        if (data.results && data.results[0]?.alternatives?.[0]?.transcript) {
          const text = data.results[0].alternatives[0].transcript as string;
          setLastSpeechChangeAt(Date.now());
          if (data.results[0].isFinal) {
            setAnswer(prev => `${prev} ${text}`.trim());
            setInterimTranscript('');
          } else {
            setInterimTranscript(text);
          }
        }
      };

      socketRef.current.onerror = () => cleanupRecording();
      socketRef.current.onclose = () => cleanupRecording();
    } catch {
      cleanupRecording();
    }
  };

  const stopRecording = () => {
    socketRef.current?.send(JSON.stringify({ event: 'stop' }));
    cleanupRecording();
  };

  const playVoiceDemo = async (voiceName: string, voiceCode: string) => {
    try {
      const text = `Hi, I am ${voiceName}, your AI interviewer.`;
      const response = await axios.post(`${API_BASE_URL}/api/tts/demo`, {
        voiceName: voiceCode,
        languageCode,
        text,
      });
      if (response.data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${response.data.audioContent}`);
        void audio.play();
      }
    } catch (error) {
      console.error('Demo Play Error:', error);
      toast.error('Failed to play voice demo.');
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !videoEnabled) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setVideoSnapshots(prev => [...prev.slice(-4), dataUrl]); // Keep last 5 snapshots
      }
    } catch (err) {
      console.error('Snapshot error:', err);
    }
  };

  const handleStartInterview = async () => {
    if (!cvFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('phase', 'GREETING');
    formData.append('industry', industry);
    formData.append('role', selectedRole || role || 'Candidate');
    formData.append('language', lang === 'ur' ? 'Urdu' : 'English');
    formData.append('languageCode', languageCode);
    formData.append('jobDescription', jobDescription);
    formData.append('additionalInfo', additionalInfo);
    formData.append('profileSummary', profileSummary);
    formData.append('cvFile', cvFile);
    formData.append('numExpQuestions', String(numExpQuestions));
    formData.append('numRoleQuestions', String(numRoleQuestions));
    formData.append('numPersonalityQuestions', String(numPersonalityQuestions));
    formData.append('expQuestionsAsked', '0');
    formData.append('roleQuestionsAsked', '0');
    formData.append('personalityQuestionsAsked', '0');
    formData.append('selectedVoice', selectedVoice);

    try {
      if (!user) {
        toast.error('You must be signed in before starting the interview.');
        return;
      }

      const session = await createFirestoreSession({
        uid: user.uid,
        roleId: role,
        companyContext: industry || role,
        languageCode: languageCode === 'ur-PK' ? 'ur-PK' : 'en-US',
      });

      const data = await startSession(formData);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      setChatHistory([{ sender: 'ai', text: data.conversationalResponse, timestamp: now }]);
      setCurrentAnalysis(data.preAnswerAnalysis);
      setActivePhase(data.nextPhase);
      setCvText(data.cvText || '');
      setUserName(data.userName || 'Candidate');
      setAnalysisHistory([]);
      setFinalAnalysis(null);
      setSessionId(session.sessionId);
      setQuestionCounter(0);
      setExpQuestionsAsked(0);
      setRoleQuestionsAsked(0);
      setPersonalityQuestionsAsked(0);
      setQuestionMetrics([]);
      setUiMode('ACTIVE');

      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        void audio.play();
      }
    } catch (error) {
      console.error('handleStartInterview failed:', error);
      toast.error('Failed to start interview. Please retry in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    const finalAnswer = `${answer} ${interimTranscript}`.trim();
    if (!finalAnswer) return;

    setIsLoading(true);
    const phase = activePhase;
    const lastQuestion = chatHistory.filter(item => item.sender === 'ai').pop()?.text || '';

    captureSnapshot();

    const formData = new FormData();
    formData.append('phase', phase);
    formData.append('userName', userName);
    formData.append('language', lang === 'ur' ? 'Urdu' : 'English');
    formData.append('languageCode', languageCode);
    formData.append('fullChatHistory', JSON.stringify(chatHistory));
    formData.append('cvText', cvText);
    formData.append('role', selectedRole || role || 'Candidate');
    formData.append('jobDescription', jobDescription);
    formData.append('additionalInfo', additionalInfo);
    formData.append('profileSummary', profileSummary);
    formData.append('numExpQuestions', String(numExpQuestions));
    formData.append('numRoleQuestions', String(numRoleQuestions));
    formData.append('numPersonalityQuestions', String(numPersonalityQuestions));
    formData.append('expQuestionsAsked', String(expQuestionsAsked));
    formData.append('roleQuestionsAsked', String(roleQuestionsAsked));
    formData.append('personalityQuestionsAsked', String(personalityQuestionsAsked));
    formData.append('lastQuestion', lastQuestion);
    formData.append('userAnswer', finalAnswer);
    formData.append('selectedVoice', selectedVoice);

    try {
      const data = await submitAnswer(formData);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const updatedHistory = [
        ...chatHistory,
        { sender: 'user', text: finalAnswer, timestamp: now },
        { sender: 'ai', text: data.conversationalResponse, timestamp: now },
      ] as Message[];
      setChatHistory(updatedHistory);

      // Increment question counts based on the phase we just answered
      if (phase === 'EXPERIENCE') setExpQuestionsAsked(prev => prev + 1);
      else if (phase === 'ROLE_SPECIFIC') setRoleQuestionsAsked(prev => prev + 1);
      else if (phase === 'PERSONALITY') setPersonalityQuestionsAsked(prev => prev + 1);

      const analysis = data.postAnswerAnalysis || data.preAnswerAnalysis;
      setCurrentAnalysis(analysis);
      
      let updatedAnalysisHistory = analysisHistory;
      if (data.postAnswerAnalysis) {
        updatedAnalysisHistory = [...analysisHistory, data.postAnswerAnalysis as Analysis];
        setAnalysisHistory(updatedAnalysisHistory);
      }

      const nudge = await getStarNudge({
        transcript: finalAnswer,
        question: lastQuestion,
        language: lang === 'ur' ? 'Urdu' : 'English',
      });
      toast.success(`${copy.nudgeLabel}: ${nudge.nudge}`, { duration: 3200 });

      const nextQuestionId = questionCounter + 1;
      const currentStarStatus = nudge.starStatus || {
        hasSituation: false,
        hasTask: false,
        hasAction: false,
        hasResult: false,
      };

      const metricPayload = {
        questionId: `Q${nextQuestionId}`,
        confidence: hud.confidenceScore,
        wpm: hud.wpm,
        fillerCount: hud.fillerCount,
        panic: hud.panicFlag,
        starMissing: nudge.starMissing,
        score: nudge.score,
        starStatus: currentStarStatus,
        createdAt: new Date().toISOString(),
      };
      setQuestionCounter(nextQuestionId);
      setQuestionMetrics(prev => [...prev, metricPayload]);

      if (sessionId) {
        await appendSessionQuestionMetric(sessionId, metricPayload);
      }

      setActivePhase(data.nextPhase);
      setAnswer('');
      setInterimTranscript('');

      if (data.nextPhase === 'FINISHED') {
        const summary = await getSummary({
          fullChatHistory: updatedHistory,
          analysisHistory: updatedAnalysisHistory,
          language: lang === 'ur' ? 'Urdu' : 'English',
        });

        if (sessionId) {
          await finalizeFirestoreSession(sessionId, {
            finalScore: summary.finalScore || 0,
            strengths: summary.strengths ? [summary.strengths] : [],
            improvements: summary.areasForImprovement ? [summary.areasForImprovement] : [],
            transcript: updatedHistory,
            metricsTimeline: [...questionMetrics, metricPayload],
            videoSnapshots,
          });
        }

        setFinalAnalysis(summary);
        setUiMode('SUMMARY');
      }

      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        void audio.play();
      }
    } catch (error) {
      console.error('handleSubmitAnswer failed:', error);
      toast.error('Could not process your answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      sx={{
        pb: 4,
        direction: lang === 'ur' ? 'rtl' : 'ltr',
        fontFamily: lang === 'ur' ? '"Noto Nastaliq Urdu", serif' : 'inherit',
      }}
    >
      <Toaster position="top-right" />
      <AppBar elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.75)', color: '#0f172a', backdropFilter: 'blur(12px)' }}>
        <Container maxWidth={false}>
          <Toolbar disableGutters>
            <Typography variant="h6" fontWeight={700}>AI Interview Coach Pro Max</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <LanguageToggle
              language={lang}
              onToggle={() => {
                const nextLanguage = lang === 'en' ? 'ur' : 'en';
                setLang(nextLanguage);
                setAppLanguage(nextLanguage);
              }}
            />
          </Toolbar>
        </Container>
      </AppBar>

      <Toolbar />
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {uiMode === 'SETUP' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
                  <Box sx={{ p: 4, background: 'linear-gradient(120deg,#0b84ff 0%,#0ea5a0 55%,#0f172a 100%)', color: 'white' }}>
                    <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5 }}>
                      {lang === 'ur' ? 'پروفیشنل انٹرویو پریکٹس' : 'Premium Interview Practice'}
                    </Typography>
                    <Typography sx={{ opacity: 0.9 }}>
                      {lang === 'ur'
                        ? 'Live Speech Intelligence HUD کے ساتھ فوری فیڈبیک حاصل کریں۔'
                        : 'Train with a live Speech Intelligence HUD and role-specific AI feedback.'}
                    </Typography>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={5}>
              <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                      {copy.sessionSetup} - Step {setupStep} of 3
                    </Typography>

                    <Grid container spacing={2}>
                      {setupStep === 1 && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>Language Preference</Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant={lang === 'en' ? 'contained' : 'outlined'}
                                onClick={() => { setLang('en'); setAppLanguage('en'); }}
                                fullWidth
                              >
                                English
                              </Button>
                              <Button
                                variant={lang === 'ur' ? 'contained' : 'outlined'}
                                onClick={() => { setLang('ur'); setAppLanguage('ur'); }}
                                fullWidth
                                sx={{ fontFamily: 'Noto Nastaliq Urdu' }}
                              >
                                اردو
                              </Button>
                            </Stack>
                          </Grid>

                          <Grid item xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>Voice Selection</InputLabel>
                              <Select
                                value={selectedVoice}
                                label="Voice Selection"
                                onChange={e => setSelectedVoice(e.target.value)}
                                renderValue={(value) => {
                                  const name = Object.entries(availableVoices).find(([_, code]) => code === value)?.[0] || value;
                                  return name;
                                }}
                              >
                                {Object.entries(availableVoices).map(([name, code]) => (
                                  <MenuItem key={String(code)} value={String(code)}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                                      <Typography>{name}</Typography>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          playVoiceDemo(name, String(code));
                                        }}
                                      >
                                        <PlayCircleOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Button fullWidth variant="contained" onClick={() => setSetupStep(2)}>Next: Role Details</Button>
                          </Grid>
                        </>
                      )}

                      {setupStep === 2 && (
                        <>
                          {selectedRole ? (
                            <Grid item xs={12}>
                              <Alert severity="info" sx={{ mb: 2 }}>
                                {lang === 'ur'
                                  ? `آپ ${selectedRole} کے لیے انٹرویو دے رہے ہیں۔`
                                  : `You are interviewing for: ${selectedRole}`}
                              </Alert>
                            </Grid>
                          ) : (
                            <>
                              <Grid item xs={12}>
                                <FormControl fullWidth>
                                  <InputLabel>Industry</InputLabel>
                                  <Select value={industry} label="Industry" onChange={e => handleIndustryChange(e.target.value)}>
                                    {(jobsData?.industries || []).map(item => (
                                      <MenuItem key={item.name} value={item.name}>{item.name}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12}>
                                <FormControl fullWidth>
                                  <InputLabel>Role</InputLabel>
                                  <Select value={role} label="Role" onChange={e => setRole(e.target.value)}>
                                    {availableRoles.map(item => (
                                      <MenuItem key={item} value={item}>{item}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12}>
                            <TextField fullWidth multiline rows={3} label="Job Description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
                          </Grid>

                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={1}>
                              <Button fullWidth variant="outlined" onClick={() => setSetupStep(1)}>Back</Button>
                              <Button fullWidth variant="contained" onClick={() => setSetupStep(3)}>Next: Upload CV</Button>
                            </Stack>
                          </Grid>
                        </>
                      )}

                      {setupStep === 3 && (
                        <>
                          <Grid item xs={12}>
                            <Button component="label" fullWidth variant="outlined" sx={{ py: 3, borderStyle: 'dashed' }}>
                              {cvFile ? cvFile.name : 'Click to Upload CV (PDF)'}
                              <input hidden type="file" accept=".pdf" onChange={e => setCvFile(e.target.files?.[0] || null)} />
                            </Button>
                          </Grid>

                          <Grid item xs={12}>
                            <TextField fullWidth multiline rows={3} label="Profile Summary" value={profileSummary} onChange={e => setProfileSummary(e.target.value)} placeholder="Briefly describe your background..." />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>Question Distribution</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="caption">Exp {numExpQuestions}</Typography>
                                <Slider min={1} max={6} step={1} value={numExpQuestions} onChange={(_, v) => setNumExpQuestions(v as number)} />
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption">Role {numRoleQuestions}</Typography>
                                <Slider min={1} max={6} step={1} value={numRoleQuestions} onChange={(_, v) => setNumRoleQuestions(v as number)} />
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption">Pers {numPersonalityQuestions}</Typography>
                                <Slider min={1} max={6} step={1} value={numPersonalityQuestions} onChange={(_, v) => setNumPersonalityQuestions(v as number)} />
                              </Grid>
                            </Grid>
                          </Grid>

                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={1}>
                              <Button fullWidth variant="outlined" onClick={() => setSetupStep(2)}>Back</Button>
                              <Button fullWidth variant="contained" size="large" onClick={handleStartInterview} disabled={!cvFile || isLoading}>
                                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Start Interview'}
                              </Button>
                            </Stack>
                          </Grid>
                        </>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {uiMode === 'ACTIVE' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">{userName} • {role}</Typography>
                  <Typography variant="body2" color="text.secondary">{copy.phase}: {activePhase}</Typography>
                </CardContent>
                <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                  {chatHistory.map((msg, idx) => (
                    <motion.div key={`${msg.sender}-${idx}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                      <Box sx={{ mb: 1.4, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                        <Paper sx={{ display: 'inline-block', px: 1.4, py: 1, bgcolor: msg.sender === 'user' ? '#0b84ff' : '#f3f4f6', color: msg.sender === 'user' ? 'white' : 'black' }}>
                          {msg.sender === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : <Typography>{msg.text}</Typography>}
                        </Paper>
                      </Box>
                    </motion.div>
                  ))}
                </Box>

                <Divider />
                <Box sx={{ p: 1.2 }}>
                  <Paper component="form" onSubmit={e => { e.preventDefault(); handleSubmitAnswer(); }} sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={isRecording ? stopRecording : startRecording}>
                      {isRecording ? <StopIcon color="error" titleAccess={copy.stop} /> : <MicIcon color="primary" />}
                    </IconButton>
                    <InputBase
                      value={isRecording ? `${answer} ${interimTranscript}`.trim() : answer}
                      onChange={e => setAnswer(e.target.value)}
                      multiline
                      maxRows={3}
                      sx={{ ml: 1, flexGrow: 1 }}
                      placeholder={isRecording ? copy.listening : copy.shareAnswer}
                    />
                    <IconButton type="submit" disabled={isLoading || !(`${answer} ${interimTranscript}`.trim())}>
                      <SendIcon color="primary" />
                    </IconButton>
                  </Paper>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
                <Box sx={{ mb: 2, position: 'relative', borderRadius: 4, overflow: 'hidden', bgcolor: 'black', aspectRatio: '16/9' }}>
                  {videoEnabled ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <VideocamOffIcon sx={{ fontSize: 48 }} />
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                    <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} onClick={() => setVideoEnabled(!videoEnabled)}>
                      {videoEnabled ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <SpeechHUD metrics={hud} language={lang} nudgeText={currentNudge} />
                </Box>

                <Card>
                  <CardContent>
                    <Typography variant="h6">AI Analyst</Typography>
                    {!currentAnalysis && <Typography color="text.secondary">Score and STAR-style hints will appear here.</Typography>}
                    {currentAnalysis?.score !== undefined && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <Typography variant="h4" sx={{ mt: 1 }}>{currentAnalysis.score}/10</Typography>
                      </motion.div>
                    )}
                    {currentAnalysis?.feedback && <ReactMarkdown>{currentAnalysis.feedback}</ReactMarkdown>}
                    {currentAnalysis?.hint && <><Divider sx={{ my: 1 }} /><Typography variant="subtitle2">Hint</Typography><ReactMarkdown>{currentAnalysis.hint}</ReactMarkdown></>}
                    {currentAnalysis?.exampleAnswer && <><Divider sx={{ my: 1 }} /><Typography variant="subtitle2">Example</Typography><ReactMarkdown>{currentAnalysis.exampleAnswer}</ReactMarkdown></>}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {uiMode === 'SUMMARY' && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card sx={{ maxWidth: 900, mx: 'auto' }}>
              <CardContent>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>{copy.finalReport}</Typography>
                <Typography variant="h5" sx={{ mb: 2 }}>{copy.overallScore}: {finalAnalysis?.finalScore ?? 0}/10</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">{copy.strengths}</Typography>
                <ReactMarkdown>{finalAnalysis?.strengths || ''}</ReactMarkdown>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">{copy.improvements}</Typography>
                <ReactMarkdown>{finalAnalysis?.areasForImprovement || ''}</ReactMarkdown>
                <Box sx={{ display: 'flex', gap: 1.2, mt: 2, flexWrap: 'wrap' }}>
                  <Button variant="contained" onClick={() => setUiMode('SETUP')}>{copy.startNewSession}</Button>
                  {sessionId ? (
                    <Button component={Link} href={`/report/${sessionId}`} variant="outlined">
                      {lang === 'ur' ? 'تفصیلی رپورٹ دیکھیں' : 'Open Detailed Report'}
                    </Button>
                  ) : null}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Container>
    </Box>
  );
}
