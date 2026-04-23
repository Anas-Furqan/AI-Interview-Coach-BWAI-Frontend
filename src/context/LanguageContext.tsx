import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AppLanguage = 'en' | 'ur';

interface LanguageContextType {
  lang: AppLanguage;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  toggleLang: () => {},
});

const STORAGE_KEY = 'ai-interview-coach-lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<AppLanguage>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'ur' ? 'ur' : 'en';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'ur' ? 'ur' : 'en';
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      toggleLang: () => setLang(prev => (prev === 'en' ? 'ur' : 'en')),
    }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
