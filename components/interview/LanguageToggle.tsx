'use client';

import { Button } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';

interface LanguageToggleProps {
  language: 'en' | 'ur';
  onToggle: () => void;
}

export default function LanguageToggle({ language, onToggle }: LanguageToggleProps) {
  return (
    <Button startIcon={<TranslateIcon />} variant="outlined" color="inherit" onClick={onToggle}>
      {language === 'en' ? 'EN | اردو' : 'اردو | EN'}
    </Button>
  );
}
