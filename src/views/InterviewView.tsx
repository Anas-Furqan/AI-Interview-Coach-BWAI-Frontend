// src/views/InterviewView.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Grid, Box, useTheme, useMediaQuery, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import InsightsIcon from '@mui/icons-material/Insights';
import AnalysisPanel from '../components/AnalysisPanel';
import ChatSession from '../components/ChatSession';
import SummaryView from '../components/SummaryView';
import LiveSpeechHud from '../components/LiveSpeechHud';
import { Message, Analysis, FinalAnalysis } from '../hooks/useInterviewState';

interface InterviewViewProps {
  interviewPhase: string;
  chatHistory: Message[];
  currentAnalysis: Analysis | null;
  isLoading: boolean;
  isAudioPlaying: boolean;
  activePhase: string;
  canRetry: boolean;
  isFinished: boolean;
  liveSpeechText: string;
  isRecording: boolean;
  onLiveSpeechUpdate: (payload: { text: string; isRecording: boolean }) => void;
  onSubmitAnswer: (answer: string) => void;
  onGetSummary: () => void;
  onRetry: () => void;
  finalAnalysis: FinalAnalysis | null;
  onRestart: () => void;
  userName: string;
  industry: string;
  role: string;
  targetCompany?: string;
  language: string;
  languageMap: { [key: string]: string };
}

const InterviewView: React.FC<InterviewViewProps> = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.log('Camera denied', err));

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileView, setMobileView] = useState<'chat' | 'analyst'>('chat');

  const handleMobileViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'chat' | 'analyst',
  ) => {
    if (newView !== null) {
      setMobileView(newView);
    }
  };

  if (props.interviewPhase === 'SUMMARY') {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, width: '100%' }}>
          <SummaryView analysis={props.finalAnalysis} onRestart={props.onRestart} />
      </Box>
    );
  }

  return (
    <>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 2 }}>
          <ToggleButtonGroup
            value={mobileView}
            exclusive
            onChange={handleMobileViewChange}
            aria-label="view selection"
            size="small"
          >
            <ToggleButton value="chat" aria-label="chat view">
              <ChatBubbleOutlineIcon sx={{ mr: 1 }} />
              Interview
            </ToggleButton>
            <ToggleButton value="analyst" aria-label="analyst view">
              <InsightsIcon sx={{ mr: 1 }} />
              Analyst
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <Grid container spacing={4} sx={{ height: '100%', flexGrow: 1, p: '20px' }}>
        <Grid 
          item 
          xs={12} 
          md={9} 
          sx={{ 
            height: '100%',
            display: isMobile && mobileView !== 'chat' ? 'none' : 'block'
          }}
        >
          <Box sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', bgcolor: '#000', position: 'relative', height: { xs: '220px', md: '260px' } }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <Box sx={{ position: 'absolute', top: 12, left: 12, px: 1.5, py: 0.5, bgcolor: 'rgba(0,0,0,0.65)', borderRadius: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="white" sx={{ fontWeight: 700 }}>
                Live Interview
              </Typography>
              <Typography variant="caption" color="grey.300">
                {props.targetCompany ? `${props.targetCompany} / ${props.role}` : props.role}
              </Typography>
            </Box>
          </Box>
          <ChatSession
            chatHistory={props.chatHistory}
            isLoading={props.isLoading}
            isAudioPlaying={props.isAudioPlaying}
            liveSpeechText={props.liveSpeechText}
            isRecording={props.isRecording}
            activePhase={props.activePhase}
            isFinished={props.isFinished}
            onLiveSpeechUpdate={props.onLiveSpeechUpdate}
            onSubmitAnswer={props.onSubmitAnswer}
            onGetSummary={props.onGetSummary}
            userName={props.userName}
            industry={props.industry}
            role={props.role}
            language={props.language}
            languageMap={props.languageMap}
          />
        </Grid>

        <Grid 
          item 
          xs={12} 
          md={3} 
          sx={{ 
            height: '100%',
            display: isMobile && mobileView !== 'analyst' ? 'none' : 'block',
            position: 'sticky', top: 0, alignSelf: 'flex-start'
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <LiveSpeechHud
              liveSpeechText={props.liveSpeechText}
              isRecording={props.isRecording}
              languageCode={props.languageMap[props.language] || 'en-US'}
            />
            <AnalysisPanel 
              analysis={props.currentAnalysis} 
              isLoading={props.isLoading} 
              onRetry={props.onRetry}
              canRetry={props.canRetry} 
            />
          </Box>
        </Grid>
        
      </Grid>
    </>
  );
};

export default InterviewView;