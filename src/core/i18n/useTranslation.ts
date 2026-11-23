import { create } from 'zustand';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { translations } from './translations';
import { Language } from '../types/common.types';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const getInitialLanguage = (): Language => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('prometheus-lite-lang');
    if (saved === 'en' || saved === 'es') return saved;
  }
  return 'es';
};

const initialLang = getInitialLanguage();
dayjs.locale(initialLang);
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

export const useTranslation = create<I18nStore>((set, get) => ({
  language: initialLang,
  setLanguage: (lang: Language) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('prometheus-lite-lang', lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
    dayjs.locale(lang);
    set({ language: lang });
  },
  t: (key: string, fallback?: string) => {
    const lang = get().language;
    return translations[lang]?.[key] || fallback || key;
  },
}));
