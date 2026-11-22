import { create } from 'zustand';
import { translations } from './translations';
import { Language } from '../types/common.types';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const getInitialLanguage = (): Language => {
  const saved = localStorage.getItem('prometheus-lite-lang');
  if (saved === 'en' || saved === 'es') return saved;
  return 'es';
};

export const useTranslation = create<I18nStore>((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (lang: Language) => {
    localStorage.setItem('prometheus-lite-lang', lang);
    set({ language: lang });
  },
  t: (key: string, fallback?: string) => {
    const lang = get().language;
    return translations[lang]?.[key] || fallback || key;
  },
}));

