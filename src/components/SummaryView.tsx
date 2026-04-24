// src/components/SummaryView.tsx

import React from 'react';
import {
  Typography, Box, Paper, CircularProgress, Divider, Button
} from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface FinalAnalysis {
  finalScore: number;
  strengths: string;
  areasForImprovement: string;
  selectionProbability?: number;
}

interface SummaryViewProps {
  analysis: FinalAnalysis | null;
  onRestart: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ analysis, onRestart }) => (
    <Paper elevation={3} sx={{ p: 3, maxWidth: '800px', mx: 'auto' }}>
        <Typography variant="h5" sx={{ textAlign: 'center', mb: 2 }}>Final Interview Summary</Typography>
        {analysis ? (
            <Box>
                <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, color: 'primary.main' }}>Overall Score: {analysis.finalScore}/10</Typography>
                {analysis.selectionProbability !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 2 }}>
                    <CircularProgress variant="determinate" value={analysis.selectionProbability} size={72} thickness={5} sx={{ color: 'success.main' }} />
                    <Box>
                      <Typography variant="h6">Selection Probability</Typography>
                      <Typography variant="subtitle1" color="text.secondary">{analysis.selectionProbability}% chance of selection</Typography>
                    </Box>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Key Strengths</Typography>
                <ReactMarkdown>{analysis.strengths}</ReactMarkdown>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Areas for Improvement</Typography>
                <ReactMarkdown>{analysis.areasForImprovement}</ReactMarkdown>
            </Box>
        ) : <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}
        <Button fullWidth variant="contained" size="large" onClick={onRestart} sx={{ mt: 4 }}>
            Start a New Interview
        </Button>
        <Button fullWidth variant="outlined" size="large" onClick={() => window.print()} sx={{ mt: 2 }}>
            Download Scorecard (PDF)
        </Button>
    </Paper>
);

export default SummaryView;