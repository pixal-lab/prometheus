import { create } from 'zustand';
import { ThemeMode } from '../types/common.types';

interface ThemeStore {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const applyThemeClasses = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  if (document.body) {
    document.body.classList.toggle('dark', isDark);
  }
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = 'light';
  }
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('darkMode');
  const mode: ThemeMode = saved === 'enabled' ? 'dark' : 'light';
  applyThemeClasses(mode);
  return mode;
};

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
  setTheme: (mode: ThemeMode) => {
    applyThemeClasses(mode);
    localStorage.setItem('darkMode', mode === 'dark' ? 'enabled' : 'disabled');
    set({ theme: mode });
  },
}));
