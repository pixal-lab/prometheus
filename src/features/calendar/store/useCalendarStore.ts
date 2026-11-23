import { create } from 'zustand';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);

import { storage } from '../../../core/storage/dexieStorage';
import {
  ClassBlock,
  SubjectConfig,
  SchoolYear,
  DayTypeInfo,
  CustomDayColor,
  CalendarExportData,
} from '../../../core/types/calendar.types';
import { logger } from '../../../core/debug/logger';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda' | 'quarter' | 'semester' | 'year';

interface CalendarStore {
  classBlocks: ClassBlock[];
  subjects: Record<string, SubjectConfig>;
  subjectOrder: string[];
  schoolYears: SchoolYear[];
  activeSchoolYearId: number | null;
  calendarDayTypes: Record<string, DayTypeInfo>;
  dayColorPalette: CustomDayColor[];
  hemisphere: 'south' | 'north';

  currentView: CalendarViewType;
  currentDate: string; // YYYY-MM-DD
  isLoading: boolean;

  undoStack: ClassBlock[][];
  redoStack: ClassBlock[][];

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;

  setCurrentView: (view: CalendarViewType) => void;
  setCurrentDate: (date: string) => void;
  navigateDate: (direction: 'prev' | 'next' | 'today') => void;

  addBlock: (block: Omit<ClassBlock, 'id'>) => Promise<string>;
  updateBlock: (id: string, updates: Partial<ClassBlock>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  duplicateBlock: (id: string) => Promise<void>;
  moveBlock: (id: string, targetDate: string) => Promise<void>;
  rescheduleBlock: (blockId: string, cascade?: boolean) => Promise<void>;
  moveSubjectBlocks: (subject: string, daysOffset: number) => Promise<number>;
  pushEventsInCascade: (fromBlockId: string, daysOffset: number) => Promise<void>;

  undo: () => void;
  redo: () => void;

  setSubject: (name: string, config: SubjectConfig) => Promise<void>;
  deleteSubject: (name: string) => Promise<void>;
  setSubjectOrder: (order: string[]) => Promise<void>;

  setDayType: (date: string, typeInfo: DayTypeInfo | null) => Promise<void>;
  addDayColor: (color: string, label: string) => Promise<void>;
  updateDayColor: (index: number, color: string, label: string) => Promise<void>;
  deleteDayColor: (index: number) => Promise<void>;

  setHemisphere: (hemisphere: 'south' | 'north') => Promise<void>;

  addSchoolYear: (year: Omit<SchoolYear, 'id'>) => Promise<void>;
  updateSchoolYear: (id: number, updates: Partial<SchoolYear>) => Promise<void>;
  deleteSchoolYear: (id: number) => Promise<void>;
  setActiveSchoolYear: (id: number) => Promise<void>;
  copyOrMoveYearEvents: (sourceYearId: number, targetYearId: number, subjectNames: string[], action: 'copy' | 'move') => Promise<number>;
}

const defaultSubjects: Record<string, SubjectConfig> = {
  Matemáticas: { color: '#1abc9c', visible: true, availableDays: ['L', 'M', 'X', 'J', 'V'] },
  Ciencias: { color: '#3498db', visible: true, availableDays: ['L', 'M', 'X', 'J', 'V'] },
  Lenguaje: { color: '#9b59b6', visible: true, availableDays: ['L', 'M', 'X', 'J', 'V'] },
  Historia: { color: '#e67e22', visible: true, availableDays: ['L', 'M', 'X', 'J', 'V'] },
};

const defaultSchoolYears: SchoolYear[] = [
  {
    id: 1,
    name: 'Año Escolar 2026',
    startDate: '2026-03-01',
    endDate: '2026-12-15',
  },
];

const defaultDayPalette: CustomDayColor[] = [
  { color: '#b71c1c', label: 'Evento del Colegio' },
  { color: '#0d47a1', label: 'Feriado / Día Libre' },
  { color: '#616161', label: 'Jornada Docente (In-Service)' },
  { color: '#f57f17', label: 'Salida Temprana' },
];

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  classBlocks: [],
  subjects: defaultSubjects,
  subjectOrder: Object.keys(defaultSubjects),
  schoolYears: defaultSchoolYears,
  activeSchoolYearId: 1,
  calendarDayTypes: {},
  dayColorPalette: defaultDayPalette,
  hemisphere: (localStorage.getItem('hemisphere') as 'south' | 'north') || 'south',

  currentView: 'month',
  currentDate: dayjs().format('YYYY-MM-DD'),
  isLoading: true,

  undoStack: [],
  redoStack: [],

  loadData: async () => {
    try {
      set({ isLoading: true });
      const blocks = (await storage.getItem<ClassBlock[]>('classBlocks')) || [];
      const subs = await storage.getItem<Record<string, SubjectConfig>>('subjects');
      const subOrder = await storage.getItem<string[]>('subjectOrder');
      const years = await storage.getItem<SchoolYear[]>('schoolYears');
      const activeYearId = await storage.getItem<number>('activeSchoolYearId');
      const dayTypes = (await storage.getItem<Record<string, DayTypeInfo>>('calendarDayTypes')) || {};
      const palette = (await storage.getItem<CustomDayColor[]>('dayColorPalette')) || defaultDayPalette;
      const hemi = (localStorage.getItem('hemisphere') as 'south' | 'north') || 'south';

      const finalSubjects = subs || defaultSubjects;
      const finalYears = years || defaultSchoolYears;

      // Seeding inicial de cortesía si el almacenamiento está completamente vacío
      let finalBlocks = blocks;
      if (blocks.length === 0) {
        const hasLoadedSample = localStorage.getItem('prometheus_has_seeded_initial');
        if (!hasLoadedSample) {
          const cur = dayjs();
          const curMonday = cur.startOf('isoWeek');
          finalBlocks = [
            {
              id: 'block-sample-1',
              subject: 'Matemáticas',
              topic: 'Álgebra Básica',
              date: curMonday.format('YYYY-MM-DD'),
              color: '#1abc9c',
            },
            {
              id: 'block-sample-2',
              subject: 'Ciencias',
              topic: 'Ciclo del Agua y Ecosistemas',
              date: curMonday.format('YYYY-MM-DD'),
              color: '#3498db',
            },
            {
              id: 'block-sample-3',
              subject: 'Lenguaje',
              topic: 'Comprensión Lectora y Gramática',
              date: curMonday.add(1, 'day').format('YYYY-MM-DD'),
              color: '#9b59b6',
            },
            {
              id: 'block-sample-4',
              subject: 'Historia',
              topic: 'Civilizaciones Antiguas',
              date: curMonday.add(2, 'day').format('YYYY-MM-DD'),
              color: '#e67e22',
            },
            {
              id: 'block-sample-5',
              subject: 'Matemáticas',
              topic: 'Evaluación Formativa N°1',
              date: curMonday.add(4, 'day').format('YYYY-MM-DD'),
              color: '#1abc9c',
              evaluation: true,
              evaluationDetails: 'Rúbrica de fracciones y ecuaciones básicas',
            },
          ];
          localStorage.setItem('prometheus_has_seeded_initial', 'true');
          await storage.setItem('classBlocks', finalBlocks);
        }
      }

      set({
        classBlocks: finalBlocks,
        subjects: finalSubjects,
        subjectOrder: subOrder || Object.keys(finalSubjects),
        schoolYears: finalYears,
        activeSchoolYearId: activeYearId ?? finalYears[0]?.id ?? 1,
        calendarDayTypes: dayTypes,
        dayColorPalette: palette,
        hemisphere: hemi,
        isLoading: false,
      });
    } catch (err) {
      logger.error('Calendar', 'Error cargando datos de calendario', err);
      set({ isLoading: false });
    }
  },

  saveData: async () => {
    try {
      await storage.setItem('classBlocks', get().classBlocks);
      await storage.setItem('subjects', get().subjects);
      await storage.setItem('subjectOrder', get().subjectOrder);
      await storage.setItem('schoolYears', get().schoolYears);
      await storage.setItem('activeSchoolYearId', get().activeSchoolYearId);
      await storage.setItem('calendarDayTypes', get().calendarDayTypes);
      await storage.setItem('dayColorPalette', get().dayColorPalette);
      localStorage.setItem('hemisphere', get().hemisphere);
    } catch (err) {
      logger.error('Calendar', 'Error guardando datos', err);
    }
  },

  setCurrentView: view => set({ currentView: view }),
  setCurrentDate: date => set({ currentDate: date }),

  navigateDate: direction => {
    const cur = dayjs(get().currentDate);
    const view = get().currentView;

    if (direction === 'today') {
      set({ currentDate: dayjs().format('YYYY-MM-DD') });
      return;
    }

    const step = direction === 'next' ? 1 : -1;
    let nextDate = cur;

    switch (view) {
      case 'day':
        nextDate = cur.add(step, 'day');
        break;
      case 'week':
        nextDate = cur.add(step, 'week');
        break;
      case 'quarter':
        nextDate = cur.add(step * 3, 'month');
        break;
      case 'semester':
        nextDate = cur.add(step * 6, 'month');
        break;
      case 'year':
        nextDate = cur.add(step, 'year');
        break;
      case 'month':
      case 'agenda':
      default:
        nextDate = cur.add(step, 'month');
        break;
    }

    set({ currentDate: nextDate.format('YYYY-MM-DD') });
  },

  undo: () => {
    const { undoStack, redoStack, classBlocks } = get();
    if (undoStack.length === 0) return;

    const previous = undoStack[undoStack.length - 1];
    const newUndo = undoStack.slice(0, -1);
    const newRedo = [...redoStack, classBlocks];

    set({ classBlocks: previous, undoStack: newUndo, redoStack: newRedo });
    get().saveData();
  },

  redo: () => {
    const { undoStack, redoStack, classBlocks } = get();
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];
    const newRedo = redoStack.slice(0, -1);
    const newUndo = [...undoStack, classBlocks];

    set({ classBlocks: next, undoStack: newUndo, redoStack: newRedo });
    get().saveData();
  },

  addBlock: async blockData => {
    const { classBlocks, undoStack } = get();
    const id = `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: ClassBlock = { id, ...blockData };

    set({
      classBlocks: [...classBlocks, newBlock],
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
    return id;
  },

  updateBlock: async (id, updates) => {
    const { classBlocks, undoStack } = get();
    const updated = classBlocks.map(b => (b.id === id ? { ...b, ...updates } : b));

    set({
      classBlocks: updated,
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
  },

  deleteBlock: async id => {
    const { classBlocks, undoStack } = get();
    const updated = classBlocks.filter(b => b.id !== id);

    set({
      classBlocks: updated,
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
  },

  duplicateBlock: async id => {
    const { classBlocks, undoStack } = get();
    const orig = classBlocks.find(b => b.id === id);
    if (!orig) return;

    const dup: ClassBlock = {
      ...orig,
      id: `block-${Date.now()}`,
      topic: `${orig.topic} (Copia)`,
    };

    set({
      classBlocks: [...classBlocks, dup],
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
  },

  moveBlock: async (id, targetDate) => {
    const { classBlocks, undoStack } = get();
    const updated = classBlocks.map(b => (b.id === id ? { ...b, date: targetDate } : b));

    set({
      classBlocks: updated,
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
  },

  setSubject: async (name, config) => {
    const subjects = { ...get().subjects, [name]: config };
    const subjectOrder = get().subjectOrder.includes(name)
      ? get().subjectOrder
      : [...get().subjectOrder, name];

    set({ subjects, subjectOrder });
    await get().saveData();
  },

  deleteSubject: async name => {
    const subjects = { ...get().subjects };
    delete subjects[name];
    const subjectOrder = get().subjectOrder.filter(s => s !== name);

    set({ subjects, subjectOrder });
    await get().saveData();
  },

  setSubjectOrder: async order => {
    set({ subjectOrder: order });
    await get().saveData();
  },

  setDayType: async (date, typeInfo) => {
    const calendarDayTypes = { ...get().calendarDayTypes };
    if (typeInfo === null) {
      delete calendarDayTypes[date];
    } else {
      calendarDayTypes[date] = typeInfo;
    }

    set({ calendarDayTypes });
    await get().saveData();
  },

  addDayColor: async (color, label) => {
    const dayColorPalette = [...get().dayColorPalette, { color, label }];
    set({ dayColorPalette });
    await get().saveData();
  },

  updateDayColor: async (index, color, label) => {
    const dayColorPalette = [...get().dayColorPalette];
    if (dayColorPalette[index]) {
      dayColorPalette[index] = { color, label };
      set({ dayColorPalette });
      await get().saveData();
    }
  },

  deleteDayColor: async index => {
    const dayColorPalette = get().dayColorPalette.filter((_, i) => i !== index);
    set({ dayColorPalette });
    await get().saveData();
  },

  setHemisphere: async hemisphere => {
    set({ hemisphere });
    localStorage.setItem('hemisphere', hemisphere);
  },

  addSchoolYear: async yearData => {
    const newYear: SchoolYear = { id: Date.now(), ...yearData };
    const schoolYears = [...get().schoolYears, newYear].sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    set({ schoolYears, activeSchoolYearId: newYear.id });
    await get().saveData();
  },

  updateSchoolYear: async (id, updates) => {
    const schoolYears = get().schoolYears.map(y => (y.id === id ? { ...y, ...updates } : y))
      .sort((a, b) => dayjs(a.startDate).diff(dayjs(b.startDate)));
    set({ schoolYears });
    await get().saveData();
  },

  deleteSchoolYear: async id => {
    let schoolYears = get().schoolYears.filter(y => y.id !== id);
    let activeId = get().activeSchoolYearId;
    if (activeId === id) {
      activeId = schoolYears[0]?.id || null;
    }
    set({ schoolYears, activeSchoolYearId: activeId });
    await get().saveData();
  },

  setActiveSchoolYear: async id => {
    set({ activeSchoolYearId: id });
    await get().saveData();
  },

  rescheduleBlock: async (blockId, cascade = false) => {
    const { classBlocks, subjects, undoStack } = get();
    const block = classBlocks.find(b => b.id === blockId);
    if (!block) return;

    const subConfig = subjects[block.subject];
    const available = subConfig?.availableDays || ['L', 'M', 'X', 'J', 'V'];
    const dayCodeMap: Record<string, number> = { L: 1, M: 2, X: 3, J: 4, V: 5 };
    const targetDays = available.map(d => dayCodeMap[d] ?? 0).filter(Boolean);
    const validDays = targetDays.length > 0 ? targetDays : [1, 2, 3, 4, 5];

    const getNextValidDate = (dateStr: string): string => {
      let d = dayjs(dateStr).add(1, 'day');
      while (!validDays.includes(d.isoWeekday())) {
        d = d.add(1, 'day');
      }
      return d.format('YYYY-MM-DD');
    };

    const nextDateStr = getNextValidDate(block.date);

    let updatedBlocks = [...classBlocks];
    if (cascade) {
      const origDate = dayjs(block.date);
      updatedBlocks = updatedBlocks.map(b => {
        if (b.subject === block.subject && dayjs(b.date).isSameOrAfter(origDate)) {
          return {
            ...b,
            date: getNextValidDate(b.date),
          };
        }
        return b;
      });
    } else {
      updatedBlocks = updatedBlocks.map(b => (b.id === blockId ? { ...b, date: nextDateStr } : b));
    }

    set({
      classBlocks: updatedBlocks,
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
  },

  moveSubjectBlocks: async (subject, daysOffset) => {
    const { classBlocks, undoStack } = get();
    const subjectBlocks = classBlocks.filter(b => b.subject === subject);
    if (subjectBlocks.length === 0 || daysOffset === 0) return 0;

    const shiftWeekdays = (dateStr: string, count: number): string => {
      let d = dayjs(dateStr);
      let step = count > 0 ? 1 : -1;
      let remaining = Math.abs(count);
      while (remaining > 0) {
        d = d.add(step, 'day');
        if (d.isoWeekday() <= 5) {
          remaining--;
        }
      }
      return d.format('YYYY-MM-DD');
    };

    const updatedBlocks = classBlocks.map(b => {
      if (b.subject === subject) {
        return { ...b, date: shiftWeekdays(b.date, daysOffset) };
      }
      return b;
    });

    set({
      classBlocks: updatedBlocks,
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
    return subjectBlocks.length;
  },

  pushEventsInCascade: async (fromBlockId, daysOffset) => {
    const { classBlocks, undoStack } = get();
    const startBlock = classBlocks.find(b => b.id === fromBlockId);
    if (!startBlock) return;

    const shiftWeekdays = (dateStr: string, count: number): string => {
      let d = dayjs(dateStr);
      let step = count > 0 ? 1 : -1;
      let remaining = Math.abs(count);
      while (remaining > 0) {
        d = d.add(step, 'day');
        if (d.isoWeekday() <= 5) {
          remaining--;
        }
      }
      return d.format('YYYY-MM-DD');
    };

    const startDate = dayjs(startBlock.date);
    const updatedBlocks = classBlocks.map(b => {
      if (b.subject === startBlock.subject && dayjs(b.date).isSameOrAfter(startDate)) {
        return { ...b, date: shiftWeekdays(b.date, daysOffset) };
      }
      return b;
    });

    set({
      classBlocks: updatedBlocks,
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
  },

  copyOrMoveYearEvents: async (sourceYearId, targetYearId, subjectNames, action) => {
    const { schoolYears, classBlocks, calendarDayTypes, undoStack } = get();
    const sourceYear = schoolYears.find(y => y.id === sourceYearId);
    const targetYear = schoolYears.find(y => y.id === targetYearId);
    if (!sourceYear || !targetYear) return 0;

    const sourceStart = dayjs(sourceYear.startDate);
    const sourceEnd = dayjs(sourceYear.endDate);
    const targetStart = dayjs(targetYear.startDate);
    const targetEnd = dayjs(targetYear.endDate);

    const sourceBlocks = classBlocks
      .filter(b => {
        const bDate = dayjs(b.date);
        return (
          subjectNames.includes(b.subject) &&
          bDate.isAfter(sourceStart.subtract(1, 'day')) &&
          bDate.isBefore(sourceEnd.add(1, 'day'))
        );
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (sourceBlocks.length === 0) return 0;

    // Helper: generate list of valid school days (Monday to Friday, excluding holidays)
    const getSchoolDays = (startD: dayjs.Dayjs, endD: dayjs.Dayjs): string[] => {
      const days: string[] = [];
      let cur = startD;
      while (cur.isBefore(endD) || cur.isSame(endD, 'day')) {
        const isoW = cur.isoWeekday();
        const dateStr = cur.format('YYYY-MM-DD');
        const dayInfo = calendarDayTypes[dateStr];
        const isHoliday = dayInfo && (dayInfo.type === 'holiday' || dayInfo.note?.toLowerCase().includes('feriado'));

        if (isoW >= 1 && isoW <= 5 && !isHoliday) {
          days.push(dateStr);
        }
        cur = cur.add(1, 'day');
      }
      return days;
    };

    const sourceSchoolDays = getSchoolDays(sourceStart, sourceEnd);
    const targetSchoolDays = getSchoolDays(targetStart, targetEnd);

    const sourceDateToIndex = new Map<string, number>();
    sourceSchoolDays.forEach((d, idx) => sourceDateToIndex.set(d, idx));

    const dayDiff = targetStart.diff(sourceStart, 'day');

    const newBlocks: ClassBlock[] = sourceBlocks.map((b, i) => {
      let targetDateStr: string;
      const schoolDayIdx = sourceDateToIndex.get(b.date);

      if (schoolDayIdx !== undefined && schoolDayIdx < targetSchoolDays.length) {
        // Map 1-to-1 to the equivalent school day in target year
        targetDateStr = targetSchoolDays[schoolDayIdx];
      } else {
        // Fallback: match day-of-week progression ensuring it lands on Mon-Fri
        let candidate = dayjs(b.date).add(dayDiff, 'day');
        while (candidate.isoWeekday() > 5) {
          candidate = candidate.add(1, 'day');
        }
        targetDateStr = candidate.format('YYYY-MM-DD');
      }

      return {
        ...b,
        id: `block-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        date: targetDateStr,
      };
    });

    let updatedBlocks = [...classBlocks];
    if (action === 'move') {
      const sourceIds = new Set(sourceBlocks.map(s => s.id));
      updatedBlocks = updatedBlocks.filter(b => !sourceIds.has(b.id));
    }
    updatedBlocks.push(...newBlocks);

    set({
      classBlocks: updatedBlocks,
      undoStack: [...undoStack, classBlocks],
      redoStack: [],
    });
    await get().saveData();
    return newBlocks.length;
  },
}));

