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
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  WS_BASE_URL,
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
};

export default function InterviewDashboard() {
  const { user, language: appLanguage, setLanguage: setAppLanguage } = useInterviewContext();
  const [uiMode, setUiMode] = useState<UiMode>('SETUP');
  const [lang, setLang] = useState<'en' | 'ur'>(appLanguage);

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
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [lastSpeechChangeAt, setLastSpeechChangeAt] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionCounter, setQuestionCounter] = useState(0);
  const [questionMetrics, setQuestionMetrics] = useState<Array<{
    questionId: string;
    confidence: number;
    wpm: number;
    fillerCount: number;
    panic: boolean;
    starMissing: boolean;
    score: number;
    createdAt: string;
  }>>([]);

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
          setRole(firstIndustry.roles[0]);
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
  }, [lang]);

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
      setHud(
        computeHudMetrics({
          transcript: liveText,
          startedAt: recordingStart,
          lastChangeAt: lastSpeechChangeAt,
          languageCode,
        })
      );
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

  const handleStartInterview = async () => {
    if (!cvFile) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('phase', 'GREETING');
    formData.append('industry', industry);
    formData.append('role', role);
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

    const formData = new FormData();
    formData.append('phase', phase);
    formData.append('userName', userName);
    formData.append('language', lang === 'ur' ? 'Urdu' : 'English');
    formData.append('languageCode', languageCode);
    formData.append('fullChatHistory', JSON.stringify(chatHistory));
    formData.append('cvText', cvText);
    formData.append('jobDescription', jobDescription);
    formData.append('additionalInfo', additionalInfo);
    formData.append('profileSummary', profileSummary);
    formData.append('numExpQuestions', String(numExpQuestions));
    formData.append('numRoleQuestions', String(numRoleQuestions));
    formData.append('numPersonalityQuestions', String(numPersonalityQuestions));
    formData.append('expQuestionsAsked', String(0));
    formData.append('roleQuestionsAsked', String(0));
    formData.append('personalityQuestionsAsked', String(0));
    formData.append('lastQuestion', lastQuestion);
    formData.append('userAnswer', finalAnswer);
    formData.append('selectedVoice', selectedVoice);

    try {
      const data = await submitAnswer(formData);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const updatedHistory = [...chatHistory, { sender: 'user', text: finalAnswer, timestamp: now }, { sender: 'ai', text: data.conversationalResponse, timestamp: now }] as Message[];
      setChatHistory(updatedHistory);
      setCurrentAnalysis({ ...data.postAnswerAnalysis, ...data.preAnswerAnalysis });
      if (data.postAnswerAnalysis) {
        setAnalysisHistory(prev => [...prev, data.postAnswerAnalysis as Analysis]);
      }

      const nudge = await getStarNudge({
        transcript: finalAnswer,
        question: lastQuestion,
        language: lang === 'ur' ? 'Urdu' : 'English',
      });
      toast.success(`${copy.nudgeLabel}: ${nudge.nudge}`, { duration: 3200 });

      const nextQuestionId = questionCounter + 1;
      const metricPayload = {
        questionId: `Q${nextQuestionId}`,
        confidence: hud.confidenceScore,
        wpm: hud.wpm,
        fillerCount: hud.fillerCount,
        panic: hud.panicFlag,
        starMissing: nudge.starMissing,
        score: nudge.score,
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
          analysisHistory,
          language: lang === 'ur' ? 'Urdu' : 'English',
        });

        if (sessionId) {
          await finalizeFirestoreSession(sessionId, {
            finalScore: summary.finalScore || 0,
            strengths: summary.strengths ? [summary.strengths] : [],
            improvements: summary.areasForImprovement ? [summary.areasForImprovement] : [],
            transcript: updatedHistory,
            metricsTimeline: [...questionMetrics, metricPayload],
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
    <Box minHeight="100vh" sx={{ pb: 4 }}>
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
                      {copy.sessionSetup}
                    </Typography>

                    <Grid container spacing={2}>
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

                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Voice</InputLabel>
                          <Select value={selectedVoice} label="Voice" onChange={e => setSelectedVoice(e.target.value)}>
                            {Object.entries(availableVoices).map(([name, code]) => (
                              <MenuItem key={String(code)} value={String(code)}>{name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12}>
                        <Button component="label" fullWidth variant="outlined">
                          {cvFile ? cvFile.name : copy.uploadCv}
                          <input hidden type="file" accept=".pdf" onChange={e => setCvFile(e.target.files?.[0] || null)} />
                        </Button>
                      </Grid>

                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Profile Summary" value={profileSummary} onChange={e => setProfileSummary(e.target.value)} />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Job Description" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Additional Context" value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} />
                      </Grid>

                      <Grid item xs={4}>
                        <Typography variant="caption">Experience {numExpQuestions}</Typography>
                        <Slider min={1} max={6} step={1} value={numExpQuestions} onChange={(_, v) => setNumExpQuestions(v as number)} />
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption">Role {numRoleQuestions}</Typography>
                        <Slider min={1} max={6} step={1} value={numRoleQuestions} onChange={(_, v) => setNumRoleQuestions(v as number)} />
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption">Personality {numPersonalityQuestions}</Typography>
                        <Slider min={1} max={6} step={1} value={numPersonalityQuestions} onChange={(_, v) => setNumPersonalityQuestions(v as number)} />
                      </Grid>

                      <Grid item xs={12}>
                        <Button fullWidth variant="contained" size="large" onClick={handleStartInterview} disabled={!cvFile || isLoading}>
                          {isLoading ? <CircularProgress size={22} color="inherit" /> : copy.startInterview}
                        </Button>
                      </Grid>
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
                <Box sx={{ mb: 2 }}>
                  <SpeechHUD metrics={hud} language={lang} />
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
