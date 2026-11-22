import { create } from 'zustand';
import { storage } from '../../../core/storage/dexieStorage';
import {
  TimetableData,
  TimetableEvent,
  DayOfWeek,
  TimetableBlockType,
} from '../../../core/types/timetable.types';
import { logger } from '../../../core/debug/logger';

interface ConflictState {
  isOpen: boolean;
  incomingEvent: TimetableEvent;
  targetDay: DayOfWeek;
  conflictingEvent: TimetableEvent;
}

interface TimetableStore {
  data: TimetableData;
  nonCourseConfigs: Record<string, string>; // type -> color
  isLoading: boolean;
  conflictState: ConflictState | null;

  undoStack: TimetableData[];
  redoStack: TimetableData[];

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;

  addEvent: (day: DayOfWeek, event: Omit<TimetableEvent, 'id'>) => Promise<void>;
  updateEvent: (day: DayOfWeek, eventId: string, updates: Partial<TimetableEvent>) => Promise<void>;
  deleteEvent: (day: DayOfWeek, eventId: string) => Promise<void>;
  duplicateEvent: (day: DayOfWeek, eventId: string) => Promise<void>;
  moveEvent: (fromDay: DayOfWeek, toDay: DayOfWeek, eventId: string, newStartTime: string, newEndTime: string) => Promise<void>;

  resolveConflict: (resolution: 'replace' | 'push' | 'swap' | 'fit') => Promise<void>;
  closeConflictModal: () => void;
  updateNonCourseColor: (type: TimetableBlockType, color: string) => Promise<void>;

  updateDayHours: (day: DayOfWeek, startMinutes: number, endMinutes: number) => Promise<void>;
  updateAllDayHours: (startMinutes: number, endMinutes: number) => Promise<void>;
  clearTimetable: () => Promise<void>;

  undo: () => void;
  redo: () => void;
}

const defaultNonCourseColors: Record<string, string> = {
  break: '#78909c',
  lunch: '#ffa726',
  planning: '#ab47bc',
  special: '#26a69a',
};

const createEmptyDay = () => ({
  startMinutes: 480, // 08:00
  endMinutes: 1020,  // 17:00
  events: [],
});

const initialTimetableData: TimetableData = {
  monday: {
    startMinutes: 480,
    endMinutes: 1020,
    events: [
      { id: 'tt-1', title: 'Matemáticas', startTime: '08:00', endTime: '09:30', color: '#1abc9c', type: 'course' },
      { id: 'tt-2', title: 'Recreo', startTime: '09:30', endTime: '10:00', color: '#78909c', type: 'break' },
      { id: 'tt-3', title: 'Ciencias', startTime: '10:00', endTime: '11:30', color: '#3498db', type: 'course' },
      { id: 'tt-4', title: 'Almuerzo', startTime: '13:00', endTime: '14:00', color: '#ffa726', type: 'lunch' },
    ],
  },
  tuesday: {
    startMinutes: 480,
    endMinutes: 1020,
    events: [
      { id: 'tt-5', title: 'Lenguaje', startTime: '08:00', endTime: '09:30', color: '#9b59b6', type: 'course' },
      { id: 'tt-6', title: 'Recreo', startTime: '09:30', endTime: '10:00', color: '#78909c', type: 'break' },
      { id: 'tt-7', title: 'Historia', startTime: '10:00', endTime: '11:30', color: '#e67e22', type: 'course' },
    ],
  },
  wednesday: createEmptyDay(),
  thursday: createEmptyDay(),
  friday: createEmptyDay(),
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export const useTimetableStore = create<TimetableStore>((set, get) => ({
  data: initialTimetableData,
  nonCourseConfigs: defaultNonCourseColors,
  isLoading: true,
  conflictState: null,
  undoStack: [],
  redoStack: [],

  loadData: async () => {
    try {
      set({ isLoading: true });
      const saved = await storage.getItem<TimetableData>('timetableData');
      const savedColors = await storage.getItem<Record<string, string>>('timetableNonCourseColors');

      if (saved && saved.monday) {
        set({
          data: saved,
          nonCourseConfigs: savedColors || defaultNonCourseColors,
          isLoading: false,
        });
      } else {
        set({
          data: initialTimetableData,
          nonCourseConfigs: defaultNonCourseColors,
          isLoading: false,
        });
        await storage.setItem('timetableData', initialTimetableData);
      }
    } catch (err) {
      logger.error('Timetable', 'Error cargando datos de horario', err);
      set({ isLoading: false });
    }
  },

  saveData: async () => {
    try {
      await storage.setItem('timetableData', get().data);
      await storage.setItem('timetableNonCourseColors', get().nonCourseConfigs);
    } catch (err) {
      logger.error('Timetable', 'Error guardando horario', err);
    }
  },

  undo: () => {
    const { undoStack, redoStack, data } = get();
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    set({
      data: previous,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, JSON.parse(JSON.stringify(data))],
    });
    get().saveData();
  },

  redo: () => {
    const { undoStack, redoStack, data } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({
      data: next,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, JSON.parse(JSON.stringify(data))],
    });
    get().saveData();
  },

  updateDayHours: async (day, startMinutes, endMinutes) => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    data[day].startMinutes = startMinutes;
    data[day].endMinutes = endMinutes;
    set({
      data,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  updateAllDayHours: async (startMinutes, endMinutes) => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    for (const d of days) {
      data[d].startMinutes = startMinutes;
      data[d].endMinutes = endMinutes;
    }
    set({
      data,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  clearTimetable: async () => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    for (const d of days) {
      data[d].events = [];
    }
    set({
      data,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  addEvent: async (day, eventData) => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const newEvent: TimetableEvent = {
      id: `tt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...eventData,
    };

    data[day].events.push(newEvent);
    data[day].events.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    set({
      data,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  updateEvent: async (day, eventId, updates) => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const dayEvents = data[day].events;
    const idx = dayEvents.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      dayEvents[idx] = { ...dayEvents[idx], ...updates };
      dayEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      set({
        data,
        undoStack: [...get().undoStack.slice(-30), prev],
        redoStack: [],
      });
      await get().saveData();
    }
  },

  deleteEvent: async (day, eventId) => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    data[day].events = data[day].events.filter(e => e.id !== eventId);
    set({
      data,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  duplicateEvent: async (day, eventId) => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const orig = data[day].events.find(e => e.id === eventId);
    if (!orig) return;

    const startM = timeToMinutes(orig.endTime);
    const dur = timeToMinutes(orig.endTime) - timeToMinutes(orig.startTime);
    const endM = Math.min(1020, startM + dur);

    const dup: TimetableEvent = {
      ...orig,
      id: `tt-${Date.now()}`,
      startTime: minutesToTime(startM),
      endTime: minutesToTime(endM),
    };

    data[day].events.push(dup);
    data[day].events.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    set({
      data,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  moveEvent: async (fromDay, toDay, eventId, newStartTime, newEndTime) => {
    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const fromEvents = data[fromDay].events;
    const eventIndex = fromEvents.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;

    const movingEvent = { ...fromEvents[eventIndex], startTime: newStartTime, endTime: newEndTime };
    const toEvents = data[toDay].events;

    // Check conflict
    const startM = timeToMinutes(newStartTime);
    const endM = timeToMinutes(newEndTime);
    const conflict = toEvents.find(
      e => e.id !== eventId && Math.max(startM, timeToMinutes(e.startTime)) < Math.min(endM, timeToMinutes(e.endTime))
    );

    if (conflict) {
      set({
        conflictState: {
          isOpen: true,
          incomingEvent: movingEvent,
          targetDay: toDay,
          conflictingEvent: conflict,
        },
      });
      return;
    }

    // No conflict, perform move
    fromEvents.splice(eventIndex, 1);
    toEvents.push(movingEvent);
    toEvents.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    set({
      data,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  resolveConflict: async resolution => {
    const conflict = get().conflictState;
    if (!conflict) return;

    const prev = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const { incomingEvent, targetDay, conflictingEvent } = conflict;
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const events = data[targetDay].events;

    // Remove incoming event from everywhere first
    for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]) {
      data[d].events = data[d].events.filter(e => e.id !== incomingEvent.id);
    }

    const confIndex = events.findIndex(e => e.id === conflictingEvent.id);

    if (resolution === 'replace') {
      if (confIndex !== -1) events.splice(confIndex, 1);
      events.push(incomingEvent);
    } else if (resolution === 'push') {
      events.push(incomingEvent);
      const incEnd = timeToMinutes(incomingEvent.endTime);
      let nextAvailable = incEnd;

      events
        .filter(e => e.id !== incomingEvent.id && timeToMinutes(e.startTime) >= timeToMinutes(incomingEvent.startTime))
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
        .forEach(e => {
          const dur = timeToMinutes(e.endTime) - timeToMinutes(e.startTime);
          if (timeToMinutes(e.startTime) < nextAvailable) {
            e.startTime = minutesToTime(nextAvailable);
            e.endTime = minutesToTime(nextAvailable + dur);
          }
          nextAvailable = timeToMinutes(e.endTime);
        });
    } else if (resolution === 'swap') {
      if (confIndex !== -1) {
        const oldStart = conflictingEvent.startTime;
        const oldEnd = conflictingEvent.endTime;
        events[confIndex].startTime = incomingEvent.startTime;
        events[confIndex].endTime = incomingEvent.endTime;
        incomingEvent.startTime = oldStart;
        incomingEvent.endTime = oldEnd;
        events.push(incomingEvent);
      }
    } else if (resolution === 'fit') {
      const maxEnd = timeToMinutes(conflictingEvent.startTime);
      const startM = timeToMinutes(incomingEvent.startTime);
      if (maxEnd > startM) {
        incomingEvent.endTime = minutesToTime(maxEnd);
        events.push(incomingEvent);
      }
    }

    events.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    set({
      data,
      conflictState: null,
      undoStack: [...get().undoStack.slice(-30), prev],
      redoStack: [],
    });
    await get().saveData();
  },

  closeConflictModal: () => set({ conflictState: null }),

  updateNonCourseColor: async (type, color) => {
    const nonCourseConfigs = { ...get().nonCourseConfigs, [type]: color };
    set({ nonCourseConfigs });
    await storage.setItem('timetableNonCourseColors', nonCourseConfigs);
  },
}));
