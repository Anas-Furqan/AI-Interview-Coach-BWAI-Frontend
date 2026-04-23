import React from 'react';
import { Button } from '@mui/material';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggleButton: React.FC = () => {
  const { lang, toggleLang } = useLanguage();

  return (
    <Button
      onClick={toggleLang}
      variant="outlined"
      size="small"
      color="inherit"
      sx={{ ml: 1, minWidth: 92 }}
    >
      {lang === 'ur' ? 'Urdu | EN' : 'EN | Urdu'}
    </Button>
  );
};

export default LanguageToggleButton;
