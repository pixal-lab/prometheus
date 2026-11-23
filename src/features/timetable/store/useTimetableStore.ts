import { create } from 'zustand';
import { storage } from '../../../core/storage/dexieStorage';
import {
  TimetableData,
  TimetableEvent,
  DayOfWeek,
  TimetableBlockType,
} from '../../../core/types/timetable.types';
import { logger } from '../../../core/debug/logger';

export interface ConflictState {
  isOpen: boolean;
  incomingEvent: TimetableEvent;
  targetDay: DayOfWeek;
  conflictingEvent: TimetableEvent;
  fromDay?: DayOfWeek;
  originalEvent?: TimetableEvent;
}

export interface DraggedPaletteItem {
  title: string;
  color: string;
  type: TimetableBlockType;
  durationMinutes: number;
}

interface TimetableStore {
  data: TimetableData;
  nonCourseConfigs: Record<string, string>; // type -> color
  isLoading: boolean;
  conflictState: ConflictState | null;
  draggedPaletteItem: DraggedPaletteItem | null;
  setDraggedPaletteItem: (item: DraggedPaletteItem | null) => void;

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
  const bounded = Math.max(0, Math.min(1439, m));
  const h = Math.floor(bounded / 60);
  const min = bounded % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function eliminateOverlaps(events: TimetableEvent[], dayMaxMinutes = 1439): TimetableEvent[] {
  if (events.length <= 1) return events;

  // Sort by start time. If start times are equal, preserve order
  const sorted = [...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let currentCursor = 0;
  const result: TimetableEvent[] = [];

  for (const e of sorted) {
    const startM = timeToMinutes(e.startTime);
    const endM = timeToMinutes(e.endTime);
    const dur = Math.max(15, endM - startM);

    let newStart = Math.max(startM, currentCursor);
    let newEnd = newStart + dur;

    if (newEnd > dayMaxMinutes) {
      newEnd = dayMaxMinutes;
      // Guarantee minimum 15 minute duration without going before 0
      newStart = Math.max(0, newEnd - Math.max(15, Math.min(dur, 15)));
    }
    currentCursor = newEnd;

    result.push({
      ...e,
      startTime: minutesToTime(newStart),
      endTime: minutesToTime(newEnd),
    });
  }

  return result;
}

function updateDayBoundaries(data: TimetableData, days: DayOfWeek[]) {
  const uniqueDays = Array.from(new Set(days.filter(Boolean)));
  for (const d of uniqueDays) {
    if (!data[d]) continue;
    data[d].events = eliminateOverlaps(data[d].events);
  }
}

export const useTimetableStore = create<TimetableStore>((set, get) => ({
  data: initialTimetableData,
  nonCourseConfigs: defaultNonCourseColors,
  isLoading: true,
  conflictState: null,
  draggedPaletteItem: null,
  setDraggedPaletteItem: item => set({ draggedPaletteItem: item }),
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

    const startM = timeToMinutes(newEvent.startTime);
    const endM = timeToMinutes(newEvent.endTime);
    const conflict = data[day].events.find(
      e => Math.max(startM, timeToMinutes(e.startTime)) < Math.min(endM, timeToMinutes(e.endTime))
    );

    if (conflict) {
      set({
        conflictState: {
          isOpen: true,
          incomingEvent: newEvent,
          targetDay: day,
          conflictingEvent: conflict,
        },
      });
      return;
    }

    data[day].events.push(newEvent);
    data[day].events.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    updateDayBoundaries(data, [day]);
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
      updateDayBoundaries(data, [day]);
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
    const endM = Math.min(1439, startM + dur);

    const dup: TimetableEvent = {
      ...orig,
      id: `tt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      startTime: minutesToTime(startM),
      endTime: minutesToTime(endM),
    };

    data[day].events.push(dup);
    updateDayBoundaries(data, [day]);
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

    const originalEvent = { ...fromEvents[eventIndex] };
    const movingEvent = { ...fromEvents[eventIndex], startTime: newStartTime, endTime: newEndTime };
    const toEvents = data[toDay].events;

    // Check conflict: any event on toDay (excluding eventId itself) that overlaps with [newStartTime, newEndTime]
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
          fromDay,
          originalEvent,
        },
      });
      return;
    }

    // No conflict, perform move
    fromEvents.splice(eventIndex, 1);
    toEvents.push(movingEvent);
    updateDayBoundaries(data, [fromDay, toDay]);

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
    const data = JSON.parse(JSON.stringify(get().data)) as TimetableData;
    const { incomingEvent, targetDay, conflictingEvent, fromDay, originalEvent } = conflict;

    // 1. Remove incomingEvent from everywhere first (in case it existed in fromDay or elsewhere)
    for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]) {
      data[d].events = data[d].events.filter(e => e.id !== incomingEvent.id);
    }

    const incomingStartM = timeToMinutes(incomingEvent.startTime);
    const incomingEndM = timeToMinutes(incomingEvent.endTime);
    const incomingDuration = incomingEndM - incomingStartM;

    const affectedDays: DayOfWeek[] = [targetDay];
    if (fromDay && fromDay !== targetDay) affectedDays.push(fromDay);

    if (resolution === 'replace') {
      // Elimina los bloques anteriores que se superpongan y coloca el nuevo
      data[targetDay].events = data[targetDay].events.filter(e => {
        const eStart = timeToMinutes(e.startTime);
        const eEnd = timeToMinutes(e.endTime);
        const overlaps = Math.max(incomingStartM, eStart) < Math.min(incomingEndM, eEnd);
        return !overlaps;
      });

      data[targetDay].events.push(incomingEvent);

    } else if (resolution === 'push') {
      // Desplaza los bloques subsiguientes hacia abajo manteniendo su duración
      const nonPushedEvents: TimetableEvent[] = [];
      const eventsToPush: TimetableEvent[] = [];

      for (const e of data[targetDay].events) {
        const eStart = timeToMinutes(e.startTime);
        const eEnd = timeToMinutes(e.endTime);
        const overlaps = Math.max(incomingStartM, eStart) < Math.min(incomingEndM, eEnd);
        if (overlaps || eStart >= incomingStartM) {
          eventsToPush.push(e);
        } else {
          nonPushedEvents.push(e);
        }
      }

      eventsToPush.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

      let cursor = incomingEndM;
      const pushedResult: TimetableEvent[] = [];

      for (const e of eventsToPush) {
        const dur = Math.max(15, timeToMinutes(e.endTime) - timeToMinutes(e.startTime));
        const eStart = timeToMinutes(e.startTime);
        let newStart = eStart;

        if (newStart < cursor) {
          newStart = cursor;
        }
        let newEnd = newStart + dur;
        if (newEnd > 1439) {
          newEnd = 1439;
          if (newEnd - newStart < 15) {
            newStart = Math.max(0, newEnd - 15);
          }
        }
        cursor = newEnd;

        pushedResult.push({
          ...e,
          startTime: minutesToTime(newStart),
          endTime: minutesToTime(newEnd),
        });
      }

      data[targetDay].events = [...nonPushedEvents, incomingEvent, ...pushedResult];

    } else if (resolution === 'swap') {
      // Intercambia las posiciones entre el bloque nuevo y el conflictivo
      const durA = incomingDuration;
      const confStartM = timeToMinutes(conflictingEvent.startTime);
      const confEndM = timeToMinutes(conflictingEvent.endTime);
      const durB = confEndM - confStartM;

      if (fromDay && originalEvent && fromDay === targetDay) {
        // --- CASO 1: Intercambio en el mismo día ---
        const day = targetDay;
        const origStartM = timeToMinutes(originalEvent.startTime);

        // Remove both A and B from the day
        const otherEvents = data[day].events.filter(e => e.id !== incomingEvent.id && e.id !== conflictingEvent.id);

        const minStart = Math.min(origStartM, confStartM);
        const maxStart = Math.max(origStartM, confStartM);

        const hasIntermediateEvent = otherEvents.some(e => {
          const s = timeToMinutes(e.startTime);
          return s > minStart && s < maxStart;
        });

        if (!hasIntermediateEvent) {
          // Bloques contiguos/adyacentes en el mismo día
          let firstEvent: TimetableEvent;
          let secondEvent: TimetableEvent;
          let durFirst: number;
          let durSecond: number;

          if (origStartM > confStartM) {
            // A era posterior y se movió hacia arriba: A va primero, B va segundo
            firstEvent = { ...incomingEvent };
            durFirst = durA;
            secondEvent = { ...conflictingEvent };
            durSecond = durB;
          } else {
            // A era anterior y se movió hacia abajo: B va primero, A va segundo
            firstEvent = { ...conflictingEvent };
            durFirst = durB;
            secondEvent = { ...incomingEvent };
            durSecond = durA;
          }

          const firstStart = minStart;
          const firstEnd = minStart + durFirst;
          const secondStart = firstEnd;
          const secondEnd = secondStart + durSecond;

          firstEvent.startTime = minutesToTime(firstStart);
          firstEvent.endTime = minutesToTime(firstEnd);

          secondEvent.startTime = minutesToTime(secondStart);
          secondEvent.endTime = minutesToTime(secondEnd);

          data[day].events = [...otherEvents, firstEvent, secondEvent];
        } else {
          // Bloques separados con eventos intermedios en el mismo día
          const newA: TimetableEvent = {
            ...incomingEvent,
            startTime: conflictingEvent.startTime,
            endTime: minutesToTime(confStartM + durA),
          };
          const newB: TimetableEvent = {
            ...conflictingEvent,
            startTime: originalEvent.startTime,
            endTime: minutesToTime(origStartM + durB),
          };

          data[day].events = [...otherEvents, newA, newB];
        }

      } else if (fromDay && originalEvent && fromDay !== targetDay) {
        // --- CASO 2: Intercambio entre días distintos ---
        const origStartM = timeToMinutes(originalEvent.startTime);

        const newA: TimetableEvent = {
          ...incomingEvent,
          startTime: conflictingEvent.startTime,
          endTime: minutesToTime(confStartM + durA),
        };

        const newB: TimetableEvent = {
          ...conflictingEvent,
          startTime: originalEvent.startTime,
          endTime: minutesToTime(origStartM + durB),
        };

        data[targetDay].events = [
          ...data[targetDay].events.filter(e => e.id !== conflictingEvent.id),
          newA,
        ];

        data[fromDay].events = [
          ...data[fromDay].events.filter(e => e.id !== incomingEvent.id),
          newB,
        ];

      } else {
        // --- CASO 3: Sin día de origen (ej: arrastrado desde la paleta) ---
        const newA: TimetableEvent = {
          ...incomingEvent,
          startTime: conflictingEvent.startTime,
          endTime: minutesToTime(confStartM + durA),
        };

        const newB: TimetableEvent = {
          ...conflictingEvent,
          startTime: minutesToTime(confStartM + durA),
          endTime: minutesToTime(confStartM + durA + durB),
        };

        data[targetDay].events = [
          ...data[targetDay].events.filter(e => e.id !== conflictingEvent.id),
          newA,
          newB,
        ];
      }

    } else if (resolution === 'fit') {
      // Acorta la duración del nuevo bloque para ajustarlo al espacio disponible sin mover el otro
      const confStartM = timeToMinutes(conflictingEvent.startTime);
      const confEndM = timeToMinutes(conflictingEvent.endTime);
      const otherEvents = data[targetDay].events.filter(e => e.id !== conflictingEvent.id);

      // Space BEFORE conflictingEvent
      let gapBeforeStart = incomingStartM;
      for (const e of otherEvents) {
        const eEnd = timeToMinutes(e.endTime);
        if (eEnd <= confStartM && eEnd > gapBeforeStart) {
          gapBeforeStart = eEnd;
        }
      }
      const gapBefore = confStartM - gapBeforeStart;

      // Space AFTER conflictingEvent
      let gapAfterEnd = Math.max(incomingEndM, confEndM + 60);
      for (const e of otherEvents) {
        const eStart = timeToMinutes(e.startTime);
        if (eStart >= confEndM && eStart < gapAfterEnd) {
          gapAfterEnd = eStart;
        }
      }
      const gapAfter = gapAfterEnd - confEndM;

      let fittedStartM: number;
      let fittedEndM: number;

      if (incomingStartM < confStartM && gapBefore >= 15) {
        fittedStartM = gapBeforeStart;
        fittedEndM = confStartM;
      } else if (gapAfter >= 15) {
        fittedStartM = confEndM;
        fittedEndM = Math.min(gapAfterEnd, confEndM + incomingDuration);
      } else if (gapBefore >= 15) {
        fittedStartM = gapBeforeStart;
        fittedEndM = confStartM;
      } else {
        fittedStartM = confEndM;
        fittedEndM = confEndM + 30;
      }

      const fittedEvent: TimetableEvent = {
        ...incomingEvent,
        startTime: minutesToTime(fittedStartM),
        endTime: minutesToTime(fittedEndM),
      };

      data[targetDay].events.push(fittedEvent);
    }

    // Invariante de oro: eliminar garantizadamente cualquier superposición y expandir límites
    updateDayBoundaries(data, affectedDays);

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
