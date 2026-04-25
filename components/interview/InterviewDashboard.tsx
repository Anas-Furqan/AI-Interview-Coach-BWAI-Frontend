'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const WS_BASE_URL = (
  process.env.NEXT_PUBLIC_WS_URL ||
  (API_BASE_URL.startsWith('https://')
    ? API_BASE_URL.replace(/^https:/, 'wss:')
    : API_BASE_URL.startsWith('http://')
      ? API_BASE_URL.replace(/^http:/, 'ws:')
      : 'ws://localhost:8000')
).replace(/\/$/, '');

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
type InterviewDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
type InterviewMode = 'BEHAVIORAL' | 'CODING';

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
  const searchParams = useSearchParams();
  const { user, selectedRole, role: userRole, language: appLanguage, setLanguage: setAppLanguage } = useInterviewContext();
  const interviewType = (searchParams.get('interviewType') || 'mock').toLowerCase() === 'actual' ? 'actual' : 'mock';
  const applicationId = searchParams.get('applicationId') || '';
  const linkedJobId = searchParams.get('jobId') || '';
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
  const [targetCompany, setTargetCompany] = useState('');
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('MEDIUM');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('BEHAVIORAL');
  const [codeAnswer, setCodeAnswer] = useState('');
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
  const [sttFallbackActive, setSttFallbackActive] = useState(false);

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
  const sttReconnectAttemptsRef = useRef(0);
  const sttReconnectTimerRef = useRef<number | null>(null);
  const sttRetryAllowedRef = useRef(false);
  const pendingAudioChunksRef = useRef<Blob[]>([]);

  const clearSttReconnectTimer = () => {
    if (sttReconnectTimerRef.current) {
      window.clearTimeout(sttReconnectTimerRef.current);
      sttReconnectTimerRef.current = null;
    }
  };

  const emitSttFallback = () => {
    setSttFallbackActive(true);
    window.dispatchEvent(new CustomEvent('stt_fallback'));
    toast.error('Speech input is unavailable. Text mode is enabled.');
  };

  const flushPendingAudioChunks = () => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || pendingAudioChunksRef.current.length === 0) {
      return;
    }

    pendingAudioChunksRef.current.forEach(chunk => socket.send(chunk));
    pendingAudioChunksRef.current = [];
  };

  const cleanupRecording = () => {
    sttRetryAllowedRef.current = false;
    clearSttReconnectTimer();
    pendingAudioChunksRef.current = [];

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

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

  const scheduleSttReconnect = () => {
    if (!sttRetryAllowedRef.current || !audioStreamRef.current || sttFallbackActive) {
      return;
    }

    if (sttReconnectAttemptsRef.current >= 3) {
      emitSttFallback();
      cleanupRecording();
      return;
    }

    const delayMs = [1000, 2000, 4000][sttReconnectAttemptsRef.current] || 4000;
    sttReconnectAttemptsRef.current += 1;
    clearSttReconnectTimer();
    sttReconnectTimerRef.current = window.setTimeout(() => {
      if (!sttRetryAllowedRef.current || !audioStreamRef.current || sttFallbackActive) {
        return;
      }
      connectSttSocket(audioStreamRef.current);
    }, delayMs);
  };

  const connectSttSocket = (stream: MediaStream) => {
    const socket = new WebSocket(`${WS_BASE_URL}/stt`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ config: { languageCode } }));
      flushPendingAudioChunks();
    };

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.status === 'error') {
        emitSttFallback();
        cleanupRecording();
        return;
      }

      if (data.status === 'ready') {
        if (!mediaRecorderRef.current) {
          const options: MediaRecorderOptions = { mimeType: 'audio/webm;codecs=opus' };
          if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
            delete options.mimeType;
          }

          mediaRecorderRef.current = new MediaRecorder(stream, options);
          mediaRecorderRef.current.ondataavailable = chunk => {
            if (chunk.data.size === 0) return;

            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(chunk.data);
            } else {
              pendingAudioChunksRef.current.push(chunk.data);
            }
          };
          mediaRecorderRef.current.start(500);
        }

        flushPendingAudioChunks();
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

    socket.onerror = () => {
      if (sttRetryAllowedRef.current) {
        scheduleSttReconnect();
      }
    };

    socket.onclose = () => {
      if (sttRetryAllowedRef.current) {
        scheduleSttReconnect();
      }
    };
  };

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
            selectionProbability: 'سلیکشن پروبیبلیٹی',
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
            selectionProbability: 'Selection Probability',
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
  const availableVoiceValues = useMemo(
    () => Object.values(availableVoices).map(String),
    [availableVoices]
  );

  useEffect(() => {
    if (!availableVoiceValues.length) {
      if (selectedVoice) setSelectedVoice('');
      return;
    }

    if (!availableVoiceValues.includes(String(selectedVoice))) {
      setSelectedVoice(availableVoiceValues[0]);
    }
  }, [availableVoiceValues, selectedVoice]);

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

  const startRecording = async () => {
    if (isRecording) return;

    setIsRecording(true);
    setSttFallbackActive(false);
    setRecordingStart(Date.now());
    setLastSpeechChangeAt(Date.now());
    sttReconnectAttemptsRef.current = 0;
    sttRetryAllowedRef.current = true;
    pendingAudioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      connectSttSocket(stream);
    } catch {
      cleanupRecording();
    }
  };

  const stopRecording = () => {
    sttRetryAllowedRef.current = false;
    socketRef.current?.send(JSON.stringify({ event: 'stop' }));
    cleanupRecording();
  };

  const playVoiceDemo = async (voiceName: string, voiceCode: string) => {
    try {
      const text = languageCode.startsWith('ur')
        ? `السلام علیکم، میں ${voiceName} ہوں، آپ کا اے آئی انٹرویوور۔`
        : `Hi, I am ${voiceName}, your AI interviewer.`;
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

  // Detect multiple people in video using canvas analysis
  const detectMultiplePeopleInVideo = async () => {
    if (!videoRef.current || !videoEnabled) return false;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple motion/person detection by checking for significant areas of activity
      // This is a basic implementation - for production, use TensorFlow.js with Coco-SSD
      let peopleDetected = 0;
      let activePixels = 0;
      const threshold = 50; // Sensitivity threshold
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Detect skin tones and high activity areas
        if ((r > 95 && g > 40 && b > 20 && r > b && r > g) || 
            (r > 220 && g > 220 && b > 220)) {
          activePixels++;
        }
      }
      
      // Rough estimation: if we have significant active pixels, likely multiple people
      peopleDetected = Math.min(Math.floor(activePixels / 5000) + 1, 5);
      
      if (peopleDetected > 1) {
        console.warn(`Multiple people detected in video (${peopleDetected} detected). Ensure only the interviewee is visible.`);
        toast.error(`Multiple people detected (${peopleDetected}). Ensure only the interviewee is visible.`);
      }
      
      return peopleDetected > 1;
    } catch (err) {
      console.error('Multi-person detection error:', err);
      return false;
    }
  };

  // Auto-capture video snapshots during CODING questions
  useEffect(() => {
    if (uiMode !== 'ACTIVE' || !videoEnabled || !videoRef.current) return;
    
    // Capture snapshots more frequently during CODING mode
    const captureInterval = interviewMode === 'CODING' ? 5000 : 10000; // Every 5s for coding, 10s for behavioral
    
    const intervalId = window.setInterval(() => {
      captureSnapshot();
      // Check for multiple people periodically
      if (interviewMode === 'CODING') {
        detectMultiplePeopleInVideo().catch(err => console.error('Detection error:', err));
      }
    }, captureInterval);
    
    return () => window.clearInterval(intervalId);
  }, [uiMode, videoEnabled, interviewMode]);

  const handleStartInterview = async () => {
    setIsLoading(true);
    
    try {
      if (!user) {
        toast.error('You must be signed in before starting the interview.');
        setIsLoading(false);
        return;
      }
      
      // Verify that only CANDIDATE role can start interviews
      if (userRole && userRole !== 'CANDIDATE') {
        toast.error('Only candidates can take interviews. Recruiters cannot participate in interviews.');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('phase', 'GREETING');
      formData.append('industry', industry);
      formData.append('role', selectedRole || role || 'Candidate');
      formData.append('language', lang === 'ur' ? 'Urdu' : 'English');
      formData.append('languageCode', languageCode);
      formData.append('targetCompany', targetCompany);
      formData.append('difficulty', difficulty);
      formData.append('interviewMode', interviewMode);
      formData.append('jobDescription', jobDescription);
      formData.append('additionalInfo', additionalInfo);
      formData.append('profileSummary', profileSummary);
      formData.append('numExpQuestions', String(numExpQuestions));
      formData.append('numRoleQuestions', String(numRoleQuestions));
      formData.append('numPersonalityQuestions', String(numPersonalityQuestions));
      formData.append('expQuestionsAsked', '0');
      formData.append('roleQuestionsAsked', '0');
      formData.append('personalityQuestionsAsked', '0');
      formData.append('selectedVoice', selectedVoice);
      formData.append('interviewType', interviewType);
      formData.append('applicationId', applicationId);
      formData.append('jobId', linkedJobId);

      if (cvFile) {
        formData.append('cvFile', cvFile);
      }

      const session = await createFirestoreSession({
        uid: user.uid,
        roleId: selectedRole || role || 'Candidate',
        companyContext: targetCompany || industry || selectedRole || role || 'Candidate',
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
    if (!finalAnswer && !codeAnswer.trim()) return;

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
    formData.append('targetCompany', targetCompany);
    formData.append('difficulty', difficulty);
    formData.append('interviewMode', interviewMode);
    formData.append('codeAnswer', codeAnswer.trim());
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
    formData.append('interviewType', interviewType);
    formData.append('applicationId', applicationId);
    formData.append('jobId', linkedJobId);
    formData.append('hudWpm', String(hud.wpm));
    formData.append('hudConfidence', String(hud.confidenceScore));

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
      setCodeAnswer('');

      if (data.nextPhase === 'FINISHED') {
        const summary = await getSummary({
          fullChatHistory: updatedHistory,
          analysisHistory: updatedAnalysisHistory,
          language: lang === 'ur' ? 'Urdu' : 'English',
          sessionId,
          interviewType,
          applicationId,
        });

        if (sessionId) {
          await finalizeFirestoreSession(sessionId, {
            finalScore: summary.finalScore || 0,
            strengths: summary.strengths ? [summary.strengths] : [],
            improvements: summary.areasForImprovement ? [summary.areasForImprovement] : [],
            transcript: updatedHistory,
            metricsTimeline: [...questionMetrics, metricPayload],
            videoSnapshots,
            analytics: summary.analytics || null,
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
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 1) 50%, rgba(15, 23, 42, 0.98))',
      }}
    >
      {/* Animated background orbs */}
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 6, repeat: Infinity }}
        sx={{
          position: 'absolute',
          top: '5%',
          right: '10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <Toaster position="top-right" />
      <AppBar 
        elevation={0} 
        sx={{ 
          bgcolor: 'rgba(15, 23, 42, 0.8)', 
          color: '#f8fafc', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth={false}>
          <Toolbar disableGutters>
            <Typography 
              variant="h6" 
              fontWeight={800}
              sx={{
                background: 'var(--accent)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Vetto
            </Typography>
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
      <Container maxWidth="xl" sx={{ pt: 3, position: 'relative', zIndex: 1 }}>
        {uiMode === 'SETUP' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <motion.div 
                initial={{ opacity: 0, y: 24 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.45 }}
              >
                <Card className="pro-card" sx={{ 
                  borderRadius: 4, 
                  overflow: 'hidden',
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <Box sx={{ 
                    p: 5, 
                    background: 'rgba(15, 23, 42, 0.98)', 
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    }
                  }}>
                    <Typography 
                      variant="h3" 
                      fontWeight={800} 
                      sx={{ mb: 1.5 }}
                    >
                      {lang === 'ur' ? 'پروفیشنل انٹرویو پریکٹس' : 'Premium Interview Practice'}
                    </Typography>
                    <Typography sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
                      {lang === 'ur'
                        ? 'Live Speech Intelligence HUD کے ساتھ فوری فیڈبیک حاصل کریں۔'
                        : 'Train with a live Speech Intelligence HUD and role-specific AI feedback.'}
                    </Typography>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={5}>
              <motion.div 
                initial={{ opacity: 0, x: 24 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                <Card className="pro-card" sx={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h5" 
                      fontWeight={700} 
                      sx={{ 
                        mb: 2,
                        background: 'var(--accent)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {copy.sessionSetup} - Step {setupStep} of 3
                    </Typography>

                    <Grid container spacing={2}>
                      {setupStep === 1 && (
                        <>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>Language Preference</Typography>
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant={lang === 'en' ? 'contained' : 'outlined'}
                                onClick={() => { setLang('en'); setAppLanguage('en'); }}
                                fullWidth
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  background: lang === 'en' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))' : 'transparent',
                                  borderColor: 'rgba(99, 102, 241, 0.35)',
                                  '&:hover': {
                                    borderColor: 'var(--accent)',
                                    background: lang === 'en' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))' : 'rgba(99, 102, 241, 0.08)',
                                  }
                                }}
                              >
                                English
                              </Button>
                              <Button
                                variant={lang === 'ur' ? 'contained' : 'outlined'}
                                onClick={() => { setLang('ur'); setAppLanguage('ur'); }}
                                fullWidth
                                sx={{ 
                                  fontFamily: 'Noto Nastaliq Urdu',
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  background: lang === 'ur' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))' : 'transparent',
                                  borderColor: 'rgba(99, 102, 241, 0.35)',
                                  '&:hover': {
                                    borderColor: 'var(--accent)',
                                    background: lang === 'ur' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))' : 'rgba(99, 102, 241, 0.08)',
                                  }
                                }}
                              >
                                اردو
                              </Button>
                            </Stack>
                          </Grid>

                          <Grid item xs={12}>
                            <FormControl fullWidth>
                              <InputLabel sx={{ color: 'var(--text-secondary)' }}>Voice Selection</InputLabel>
                              <Select
                                value={availableVoiceValues.includes(String(selectedVoice)) ? selectedVoice : ''}
                                label="Voice Selection"
                                onChange={e => setSelectedVoice(String(e.target.value))}
                                renderValue={(value) => {
                                  if (!value) {
                                    return 'Choose a voice';
                                  }
                                  const name = Object.entries(availableVoices).find(([_, code]) => code === value)?.[0] || value;
                                  return name;
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(99, 102, 241, 0.35)',
                                  },
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
                                        sx={{ color: 'var(--accent)' }}
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
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button 
                                fullWidth 
                                variant="contained" 
                                onClick={() => setSetupStep(2)}
                                sx={{
                                  borderRadius: 2,
                                  py: 1.5,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  background: 'var(--accent)',
                                  '&:hover': {
                                    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.22)',
                                  }
                                }}
                              >
                                Next: Role Details
                              </Button>
                            </motion.div>
                          </Grid>
                        </>
                      )}

                      {setupStep === 2 && (
                        <>
                          {selectedRole ? (
                            <Grid item xs={12}>
                              <Alert severity="info" sx={{ 
                                mb: 2, 
                                borderRadius: 2,
                                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.35)',
                                color: 'var(--accent)',
                              }}>
                                {lang === 'ur'
                                  ? `آپ ${selectedRole} کے لیے انٹرویو دے رہے ہیں۔`
                                  : `You are interviewing for: ${selectedRole}`}
                              </Alert>
                            </Grid>
                          ) : (
                            <>
                              <Grid item xs={12}>
                                <FormControl fullWidth>
                                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Industry</InputLabel>
                                  <Select 
                                    value={industry} 
                                    label="Industry" 
                                    onChange={e => handleIndustryChange(e.target.value)}
                                    sx={{
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                      },
                                    }}
                                  >
                                    {(jobsData?.industries || []).map(item => (
                                      <MenuItem key={item.name} value={item.name}>{item.name}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12}>
                                <FormControl fullWidth>
                                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Interview Mode</InputLabel>
                                  <Select
                                    value={interviewMode}
                                    label="Interview Mode"
                                    onChange={e => setInterviewMode(e.target.value as InterviewMode)}
                                    sx={{
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                      },
                                    }}
                                  >
                                    <MenuItem value="BEHAVIORAL">Behavioral / General</MenuItem>
                                    <MenuItem value="CODING">Coding Round</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12}>
                                <FormControl fullWidth>
                                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Difficulty</InputLabel>
                                  <Select
                                    value={difficulty}
                                    label="Difficulty"
                                    onChange={e => setDifficulty(e.target.value as InterviewDifficulty)}
                                    sx={{
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                      },
                                    }}
                                  >
                                    <MenuItem value="EASY">Easy</MenuItem>
                                    <MenuItem value="MEDIUM">Medium</MenuItem>
                                    <MenuItem value="HARD">Hard</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12}>
                                <FormControl fullWidth>
                                  <InputLabel sx={{ color: 'var(--text-secondary)' }}>Role</InputLabel>
                                  <Select 
                                    value={role} 
                                    label="Role" 
                                    onChange={e => setRole(e.target.value)}
                                    sx={{
                                      '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                      },
                                    }}
                                  >
                                    {availableRoles.map(item => (
                                      <MenuItem key={item} value={item}>{item}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12}>
                            <TextField 
                              fullWidth 
                              label="Target Company" 
                              value={targetCompany} 
                              onChange={e => setTargetCompany(e.target.value)}
                              placeholder="Google, Amazon, McKinsey, HBL"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.35)',
                                  },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <TextField 
                              fullWidth 
                              multiline 
                              rows={3} 
                              label="Job Description" 
                              value={jobDescription} 
                              onChange={e => setJobDescription(e.target.value)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.35)',
                                  },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={1}>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                                <Button 
                                  fullWidth 
                                  variant="outlined" 
                                  onClick={() => setSetupStep(1)}
                                  sx={{
                                    borderRadius: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    '&:hover': {
                                      borderColor: 'rgba(255, 255, 255, 0.4)',
                                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    }
                                  }}
                                >
                                  Back
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                                <Button 
                                  fullWidth 
                                  variant="contained" 
                                  onClick={() => setSetupStep(3)}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    background: 'var(--accent)',
                                    '&:hover': {
                                      boxShadow: '0 10px 30px rgba(99, 102, 241, 0.22)',
                                    }
                                  }}
                                >
                                  Next: Upload CV
                                </Button>
                              </motion.div>
                            </Stack>
                          </Grid>
                        </>
                      )}

                      {setupStep === 3 && (
                        <>
                          <Grid item xs={12}>
                            <Button 
                              component="label" 
                              fullWidth 
                              variant="outlined" 
                              sx={{ 
                                py: 3, 
                                borderStyle: 'dashed',
                                borderRadius: 2,
                                borderColor: 'rgba(99, 102, 241, 0.35)',
                                '&:hover': {
                                  borderColor: 'var(--accent)',
                                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                }
                              }}
                            >
                              {cvFile ? cvFile.name : 'Click to Upload CV (PDF)'}
                              <input hidden type="file" accept=".pdf" onChange={e => setCvFile(e.target.files?.[0] || null)} />
                            </Button>
                          </Grid>

                          <Grid item xs={12}>
                            <TextField 
                              fullWidth 
                              multiline 
                              rows={3} 
                              label="Profile Summary" 
                              value={profileSummary} 
                              onChange={e => setProfileSummary(e.target.value)} 
                              placeholder="Briefly describe your background..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                  '&:hover fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.35)',
                                  },
                                },
                              }}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: 'var(--text-secondary)' }}>Question Distribution</Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Exp {numExpQuestions}</Typography>
                                <Slider 
                                  min={1} 
                                  max={6} 
                                  step={1} 
                                  value={numExpQuestions} 
                                  onChange={(_, v) => setNumExpQuestions(v as number)}
                                  sx={{
                                    color: 'var(--accent)',
                                    '& .MuiSlider-thumb': {
                                      '&:hover, &.Mui-focusVisible': {
                                        boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
                                      },
                                    },
                                  }}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Role {numRoleQuestions}</Typography>
                                <Slider 
                                  min={1} 
                                  max={6} 
                                  step={1} 
                                  value={numRoleQuestions} 
                                  onChange={(_, v) => setNumRoleQuestions(v as number)}
                                  sx={{
                                    color: 'var(--accent)',
                                    '& .MuiSlider-thumb': {
                                      '&:hover, &.Mui-focusVisible': {
                                        boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
                                      },
                                    },
                                  }}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Pers {numPersonalityQuestions}</Typography>
                                <Slider 
                                  min={1} 
                                  max={6} 
                                  step={1} 
                                  value={numPersonalityQuestions} 
                                  onChange={(_, v) => setNumPersonalityQuestions(v as number)}
                                  sx={{
                                    color: 'var(--accent)',
                                    '& .MuiSlider-thumb': {
                                      '&:hover, &.Mui-focusVisible': {
                                        boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
                                      },
                                    },
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </Grid>

                          <Grid item xs={12} sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={1}>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                                <Button 
                                  fullWidth 
                                  variant="outlined" 
                                  onClick={() => setSetupStep(2)}
                                  sx={{
                                    borderRadius: 2,
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                    '&:hover': {
                                      borderColor: 'rgba(255, 255, 255, 0.4)',
                                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    }
                                  }}
                                >
                                  Back
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 1 }}>
                                <Button 
                                  fullWidth 
                                  variant="contained" 
                                  size="large" 
                                  onClick={handleStartInterview} 
                                  disabled={isLoading}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    background: 'var(--accent)',
                                    '&:hover': {
                                      boxShadow: '0 10px 30px rgba(99, 102, 241, 0.22)',
                                    },
                                    '&:disabled': {
                                      background: 'rgba(255, 255, 255, 0.1)',
                                    }
                                  }}
                                >
                                  {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Start Interview'}
                                </Button>
                              </motion.div>
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
              <Card className="pro-card" sx={{ 
                height: '75vh', 
                display: 'flex', 
                flexDirection: 'column',
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
              }}>
                <CardContent sx={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.5)',
                }}>
                  <Typography variant="h6" fontWeight={600}>{userName} • {role}</Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>{copy.phase}: {activePhase}</Typography>
                </CardContent>
                <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
                  {chatHistory.map((msg, idx) => (
                    <motion.div 
                      key={`${msg.sender}-${idx}`} 
                      initial={{ opacity: 0, y: 12 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.25 }}
                    >
                      <Box sx={{ mb: 1.4, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                        <Paper sx={{ 
                          display: 'inline-block', 
                          px: 1.4, 
                          py: 1, 
                          bgcolor: msg.sender === 'user' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(79, 70, 229, 0.95))' : 'rgba(15, 23, 42, 0.8)', 
                          color: msg.sender === 'user' ? 'white' : '#e2e8f0',
                          borderRadius: 2,
                          border: msg.sender === 'ai' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        }}>
                          {msg.sender === 'ai' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : <Typography>{msg.text}</Typography>}
                        </Paper>
                      </Box>
                    </motion.div>
                  ))}
                </Box>

                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Box sx={{ p: 1.2 }}>
                  {interviewMode === 'CODING' && (
                    <Box sx={{ mb: 1.2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: 'var(--accent)', fontWeight: 600 }}>
                        Code Editor
                      </Typography>
                      <TextField
                        value={codeAnswer}
                        onChange={e => setCodeAnswer(e.target.value)}
                        multiline
                        minRows={8}
                        fullWidth
                        placeholder="Write your solution here. AI will evaluate logic, correctness, and complexity."
                        sx={{ 
                          mb: 1.2,
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            '& fieldset': {
                              borderColor: 'rgba(99, 102, 241, 0.35)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(99, 102, 241, 0.45)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'var(--accent)',
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                          },
                          '& .MuiOutlinedInput-input::placeholder': {
                            color: 'rgba(148, 163, 184, 0.5)',
                            opacity: 1,
                          },
                        }}
                      />
                    </Box>
                  )}
                  {sttFallbackActive && (
                    <Alert severity="warning" sx={{ mb: 1.2, borderRadius: 2 }}>
                      Speech input dropped. Continue in text mode and submit your answer manually.
                    </Alert>
                  )}
                  <Paper 
                    component="form" 
                    onSubmit={e => { e.preventDefault(); handleSubmitAnswer(); }} 
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      display: 'flex', 
                      alignItems: 'center',
                      bgcolor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                    }}
                  >
                    <IconButton 
                      onClick={sttFallbackActive ? undefined : (isRecording ? stopRecording : startRecording)}
                      disabled={sttFallbackActive}
                      sx={{
                        color: isRecording ? '#ef4444' : 'var(--accent)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        }
                      }}
                    >
                      {sttFallbackActive ? <MicIcon color="disabled" titleAccess="Text mode" /> : isRecording ? <StopIcon color="error" titleAccess={copy.stop} /> : <MicIcon color="primary" />}
                    </IconButton>
                    <InputBase
                      value={isRecording ? `${answer} ${interimTranscript}`.trim() : answer}
                      onChange={e => setAnswer(e.target.value)}
                      multiline
                      maxRows={3}
                      sx={{ ml: 1, flexGrow: 1, color: '#f8fafc' }}
                      placeholder={isRecording ? copy.listening : copy.shareAnswer}
                    />
                    <IconButton 
                      type="submit" 
                      disabled={isLoading || (!(`${answer} ${interimTranscript}`.trim()) && !codeAnswer.trim())}
                      sx={{ 
                        color: 'var(--accent)',
                        '&:disabled': {
                          color: 'rgba(255, 255, 255, 0.3)',
                        }
                      }}
                    >
                      <SendIcon color="primary" />
                    </IconButton>
                  </Paper>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <motion.div 
                initial={{ opacity: 0, x: 24 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.35 }}
              >
                <Box sx={{ 
                  mb: 2, 
                  position: 'relative', 
                  borderRadius: 4, 
                  overflow: 'hidden', 
                  bgcolor: '#0a0a0f', 
                  aspectRatio: '16/9',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  {videoEnabled ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <VideocamOffIcon sx={{ fontSize: 48 }} />
                    </Box>
                  )}
                  <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.5)', 
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: 'rgba(99, 102, 241, 0.25)',
                        }
                      }} 
                      onClick={() => setVideoEnabled(!videoEnabled)}
                    >
                      {videoEnabled ? <VideocamIcon fontSize="small" /> : <VideocamOffIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <SpeechHUD metrics={hud} language={lang} nudgeText={currentNudge} />
                </Box>

                <Card className="pro-card" sx={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                }}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      fontWeight={700}
                      sx={{
                        background: 'var(--accent)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      AI Analyst
                    </Typography>
                    {!currentAnalysis && <Typography sx={{ color: 'var(--text-secondary)' }}>Score and STAR-style hints will appear here.</Typography>}
                    {currentAnalysis?.score !== undefined && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            mt: 1,
                            background: 'linear-gradient(135deg, var(--accent), var(--success))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 800,
                          }}
                        >
                          {currentAnalysis.score}/10
                        </Typography>
                      </motion.div>
                    )}
                    {currentAnalysis?.feedback && <Box sx={{ color: 'var(--text-muted)' }}><ReactMarkdown>{currentAnalysis.feedback}</ReactMarkdown></Box>}
                    {currentAnalysis?.hint && (
                      <>
                        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                        <Typography variant="subtitle2" sx={{ color: 'var(--accent)' }}>Hint</Typography>
                        <Box sx={{ color: 'var(--text-muted)' }}><ReactMarkdown>{currentAnalysis.hint}</ReactMarkdown></Box>
                      </>
                    )}
                    {currentAnalysis?.exampleAnswer && (
                      <>
                        <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                        <Typography variant="subtitle2" sx={{ color: 'var(--accent)' }}>Example</Typography>
                        <Box sx={{ color: 'var(--text-muted)' }}><ReactMarkdown>{currentAnalysis.exampleAnswer}</ReactMarkdown></Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        )}

        {uiMode === 'SUMMARY' && (
          <motion.div 
            initial={{ opacity: 0, y: 18 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
          >
            <Card className="pro-card" sx={{ 
              maxWidth: 900, 
              mx: 'auto',
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={700} 
                  sx={{ 
                    mb: 2,
                    background: 'var(--accent)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {copy.finalReport}
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 2,
                    background: 'linear-gradient(135deg, var(--success), var(--accent))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {copy.overallScore}: {finalAnalysis?.finalScore ?? 0}/10
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                  {copy.selectionProbability}: {finalAnalysis?.selectionProbability ?? 0}%
                </Typography>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#10b981',
                    mb: 1
                  }}
                >
                  {copy.strengths}
                </Typography>
                <Box sx={{ color: 'var(--text-muted)', mb: 3 }}><ReactMarkdown>{finalAnalysis?.strengths || ''}</ReactMarkdown></Box>
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'var(--accent)',
                    mb: 1
                  }}
                >
                  {copy.improvements}
                </Typography>
                <Box sx={{ color: 'var(--text-muted)', mb: 3 }}><ReactMarkdown>{finalAnalysis?.areasForImprovement || ''}</ReactMarkdown></Box>
                <Box sx={{ display: 'flex', gap: 1.2, mt: 2, flexWrap: 'wrap' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="contained" 
                      onClick={() => setUiMode('SETUP')}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        background: 'var(--accent)',
                        '&:hover': {
                          boxShadow: '0 10px 30px rgba(99, 102, 241, 0.22)',
                        }
                      }}
                    >
                      {copy.startNewSession}
                    </Button>
                  </motion.div>
                  {sessionId ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        component={Link} 
                        href={`/report/${sessionId}`} 
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          borderColor: 'rgba(99, 102, 241, 0.45)',
                          color: 'var(--accent)',
                          '&:hover': {
                            borderColor: 'var(--accent)',
                            backgroundColor: 'rgba(99, 102, 241, 0.08)',
                            boxShadow: '0 5px 20px rgba(99, 102, 241, 0.16)',
                          }
                        }}
                      >
                        {lang === 'ur' ? 'تفصیلی رپورٹ دیکھیں' : 'Open Detailed Report'}
                      </Button>
                    </motion.div>
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
