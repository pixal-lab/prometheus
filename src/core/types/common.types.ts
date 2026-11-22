export type ThemeMode = 'light' | 'dark';
export type Language = 'es' | 'en';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

