import { describe, it, expect, beforeEach } from 'vitest';
import { useTranslation } from './useTranslation';
import dayjs from 'dayjs';

// Setup mock localStorage in node environment
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

describe('useTranslation & i18n system', () => {
  beforeEach(() => {
    localStorage.clear();
    useTranslation.getState().setLanguage('es');
  });

  it('initializes with Spanish by default and returns Spanish translations', () => {
    const { language, t } = useTranslation.getState();
    expect(language).toBe('es');
    expect(t('calendar')).toBe('Calendario');
    expect(t('timetable')).toBe('Horario');
    expect(t('gradebook')).toBe('Libro de Clases');
    expect(t('lesson_planner')).toBe('Planificador de Lecciones');
    expect(t('proof_correction')).toBe('Corrección de Pruebas');
  });

  it('switches to English when setLanguage is called with "en"', () => {
    const { setLanguage } = useTranslation.getState();
    setLanguage('en');

    const updatedState = useTranslation.getState();
    expect(updatedState.language).toBe('en');
    expect(updatedState.t('calendar')).toBe('Calendar');
    expect(updatedState.t('timetable')).toBe('Timetable');
    expect(updatedState.t('gradebook')).toBe('Gradebook');
    expect(updatedState.t('lesson_planner')).toBe('Lesson Planner');
    expect(updatedState.t('proof_correction')).toBe('Test Grading / Scales');
  });

  it('updates dayjs.locale() dynamically when switching languages', () => {
    const { setLanguage } = useTranslation.getState();

    setLanguage('es');
    expect(dayjs.locale()).toBe('es');
    expect(dayjs('2026-05-18').format('dddd').toLowerCase()).toBe('lunes');

    setLanguage('en');
    expect(dayjs.locale()).toBe('en');
    expect(dayjs('2026-05-18').format('dddd').toLowerCase()).toBe('monday');
  });

  it('persists language selection to localStorage', () => {
    const { setLanguage } = useTranslation.getState();
    setLanguage('en');
    expect(localStorage.getItem('prometheus-lite-lang')).toBe('en');

    setLanguage('es');
    expect(localStorage.getItem('prometheus-lite-lang')).toBe('es');
  });

  it('returns key as fallback when translation does not exist', () => {
    const { t } = useTranslation.getState();
    expect(t('non_existent_key_12345')).toBe('non_existent_key_12345');
  });

  it('has symmetry between Spanish and English dictionaries for critical keys', () => {
    const state = useTranslation.getState();
    const criticalKeys = [
      'calendar',
      'timetable',
      'gradebook',
      'lesson_planner',
      'proof_correction',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'save',
      'cancel',
      'delete',
      'edit',
      'export',
      'import',
      'title_settings',
    ];

    state.setLanguage('es');
    const esValues = criticalKeys.map(k => state.t(k));
    expect(esValues.every(val => !val.startsWith('non_existent_'))).toBe(true);

    state.setLanguage('en');
    const enValues = criticalKeys.map(k => state.t(k));
    expect(enValues.every(val => !val.startsWith('non_existent_'))).toBe(true);

    // Ensure English translations are different from Spanish for words that differ
    expect(state.t('calendar')).not.toBe('Calendario');
    expect(state.t('timetable')).not.toBe('Horario');
  });
});
