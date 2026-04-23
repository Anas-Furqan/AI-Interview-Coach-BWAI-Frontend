// src/views/InterviewView.tsx

import React, { useState } from 'react';
import { Grid, Box, useTheme, useMediaQuery, ToggleButtonGroup, ToggleButton } from '@mui/material';
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
  language: string;
  languageMap: { [key: string]: string };
}

const InterviewView: React.FC<InterviewViewProps> = (props) => {
  
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
          <ChatSession {...props} />
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