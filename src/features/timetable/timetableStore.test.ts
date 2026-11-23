import { describe, it, expect, beforeEach } from 'vitest';
import { useTimetableStore } from './store/useTimetableStore';

describe('useTimetableStore', () => {
  beforeEach(() => {
    useTimetableStore.setState({
      data: {
        monday: { startMinutes: 480, endMinutes: 1020, events: [] },
        tuesday: { startMinutes: 480, endMinutes: 1020, events: [] },
        wednesday: { startMinutes: 480, endMinutes: 1020, events: [] },
        thursday: { startMinutes: 480, endMinutes: 1020, events: [] },
        friday: { startMinutes: 480, endMinutes: 1020, events: [] },
      },
      undoStack: [],
      redoStack: [],
    });
  });

  it('adds an event and updates undo stack', async () => {
    const store = useTimetableStore.getState();
    await store.addEvent('monday', {
      title: 'Historia',
      startTime: '08:00',
      endTime: '09:30',
      color: '#e67e22',
      type: 'course',
    });

    const current = useTimetableStore.getState();
    expect(current.data.monday.events.length).toBe(1);
    expect(current.data.monday.events[0].title).toBe('Historia');
    expect(current.undoStack.length).toBe(1);
  });

  it('supports undo and redo', async () => {
    const store = useTimetableStore.getState();
    await store.addEvent('monday', {
      title: 'Matemáticas',
      startTime: '08:00',
      endTime: '09:30',
      color: '#1abc9c',
      type: 'course',
    });

    expect(useTimetableStore.getState().data.monday.events.length).toBe(1);

    // Undo
    useTimetableStore.getState().undo();
    expect(useTimetableStore.getState().data.monday.events.length).toBe(0);

    // Redo
    useTimetableStore.getState().redo();
    expect(useTimetableStore.getState().data.monday.events.length).toBe(1);
  });

  it('updates all day hours correctly', async () => {
    const store = useTimetableStore.getState();
    await store.updateAllDayHours(510, 990); // 08:30 to 16:30

    const current = useTimetableStore.getState();
    expect(current.data.monday.startMinutes).toBe(510);
    expect(current.data.monday.endMinutes).toBe(990);
    expect(current.data.friday.startMinutes).toBe(510);
    expect(current.data.friday.endMinutes).toBe(990);
  });

  it('clears timetable correctly', async () => {
    const store = useTimetableStore.getState();
    await store.addEvent('monday', {
      title: 'Artes',
      startTime: '10:00',
      endTime: '11:00',
      color: '#9b59b6',
      type: 'course',
    });

    expect(useTimetableStore.getState().data.monday.events.length).toBe(1);

    await useTimetableStore.getState().clearTimetable();
    expect(useTimetableStore.getState().data.monday.events.length).toBe(0);

    // Can be undone
    useTimetableStore.getState().undo();
    expect(useTimetableStore.getState().data.monday.events.length).toBe(1);
  });

  it('updates draggedPaletteItem state correctly', () => {
    const store = useTimetableStore.getState();
    expect(store.draggedPaletteItem).toBeNull();

    store.setDraggedPaletteItem({
      title: 'Ciencias',
      color: '#2ecc71',
      type: 'course',
      durationMinutes: 90,
    });
    expect(useTimetableStore.getState().draggedPaletteItem?.title).toBe('Ciencias');

    store.setDraggedPaletteItem(null);
    expect(useTimetableStore.getState().draggedPaletteItem).toBeNull();
  });

  it('moves an event to another day and time slot correctly', async () => {
    const store = useTimetableStore.getState();
    await store.addEvent('monday', {
      title: 'Química',
      startTime: '08:00',
      endTime: '09:30',
      color: '#3498db',
      type: 'course',
    });

    const eventId = useTimetableStore.getState().data.monday.events[0].id;
    await store.moveEvent('monday', 'tuesday', eventId, '10:15', '11:45');

    const state = useTimetableStore.getState();
    expect(state.data.monday.events.length).toBe(0);
    expect(state.data.tuesday.events.length).toBe(1);
    expect(state.data.tuesday.events[0].title).toBe('Química');
    expect(state.data.tuesday.events[0].startTime).toBe('10:15');
    expect(state.data.tuesday.events[0].endTime).toBe('11:45');
  });

  it('copies an event to another day and time slot without modifying the original event', async () => {
    const store = useTimetableStore.getState();
    await store.addEvent('monday', {
      title: 'Física',
      startTime: '08:00',
      endTime: '09:30',
      color: '#3498db',
      type: 'course',
      notes: 'Laboratorio',
    });

    const eventId = useTimetableStore.getState().data.monday.events[0].id;
    await store.copyEvent('monday', 'wednesday', eventId, '11:00', '12:30');

    const state = useTimetableStore.getState();
    // Original event remains intact on Monday
    expect(state.data.monday.events.length).toBe(1);
    expect(state.data.monday.events[0].id).toBe(eventId);
    expect(state.data.monday.events[0].title).toBe('Física');
    expect(state.data.monday.events[0].startTime).toBe('08:00');
    expect(state.data.monday.events[0].endTime).toBe('09:30');

    // New copied event created on Wednesday
    expect(state.data.wednesday.events.length).toBe(1);
    expect(state.data.wednesday.events[0].id).not.toBe(eventId);
    expect(state.data.wednesday.events[0].title).toBe('Física');
    expect(state.data.wednesday.events[0].startTime).toBe('11:00');
    expect(state.data.wednesday.events[0].endTime).toBe('12:30');
    expect(state.data.wednesday.events[0].color).toBe('#3498db');
    expect(state.data.wednesday.events[0].notes).toBe('Laboratorio');

    // Undo removes the copy and keeps original
    store.undo();
    const afterUndo = useTimetableStore.getState();
    expect(afterUndo.data.monday.events.length).toBe(1);
    expect(afterUndo.data.wednesday.events.length).toBe(0);
  });

  it('detects conflict when copying to an occupied slot without altering the original event', async () => {
    const store = useTimetableStore.getState();
    await store.addEvent('monday', {
      title: 'Música',
      startTime: '08:00',
      endTime: '09:30',
      color: '#e74c3c',
      type: 'course',
    });

    await store.addEvent('friday', {
      title: 'Taller',
      startTime: '09:00',
      endTime: '10:00',
      color: '#2ecc71',
      type: 'special',
    });

    const musicaId = useTimetableStore.getState().data.monday.events[0].id;
    // Copy Música to Friday 09:00 - 10:30 (overlaps with Taller)
    await store.copyEvent('monday', 'friday', musicaId, '09:00', '10:30');

    const state = useTimetableStore.getState();
    expect(state.conflictState?.isOpen).toBe(true);
    expect(state.conflictState?.targetDay).toBe('friday');
    expect(state.conflictState?.incomingEvent.title).toBe('Música');
    expect(state.conflictState?.conflictingEvent.title).toBe('Taller');
    // Original event still exists untouched on Monday
    expect(state.data.monday.events.length).toBe(1);
    expect(state.data.monday.events[0].title).toBe('Música');
  });

  describe('resolveConflict', () => {
    it('resolves conflict using replace: deletes conflicting event and places new one', async () => {
      const store = useTimetableStore.getState();
      // Setup existing event on tuesday
      await store.addEvent('tuesday', {
        title: 'Historia Existente',
        startTime: '10:00',
        endTime: '11:30',
        color: '#e67e22',
        type: 'course',
      });

      // Add event on monday
      await store.addEvent('monday', {
        title: 'Matemáticas Nueva',
        startTime: '08:00',
        endTime: '09:30',
        color: '#3498db',
        type: 'course',
      });

      const mathId = useTimetableStore.getState().data.monday.events[0].id;

      // Move to tuesday at 10:00 -> triggers conflict
      await store.moveEvent('monday', 'tuesday', mathId, '10:00', '11:30');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with replace
      await store.resolveConflict('replace');

      const state = useTimetableStore.getState();
      expect(state.conflictState).toBeNull();
      expect(state.data.monday.events.length).toBe(0);
      expect(state.data.tuesday.events.length).toBe(1);
      expect(state.data.tuesday.events[0].title).toBe('Matemáticas Nueva');
      expect(state.data.tuesday.events[0].startTime).toBe('10:00');
      expect(state.data.tuesday.events[0].endTime).toBe('11:30');
    });

    it('resolves conflict using push: cascades subsequent events down maintaining durations', async () => {
      const store = useTimetableStore.getState();
      // Existing event A on tuesday: 10:00 - 11:30
      await store.addEvent('tuesday', {
        title: 'Clase A',
        startTime: '10:00',
        endTime: '11:30',
        color: '#e67e22',
        type: 'course',
      });
      // Existing event B on tuesday: 11:30 - 12:30
      await store.addEvent('tuesday', {
        title: 'Clase B',
        startTime: '11:30',
        endTime: '12:30',
        color: '#9b59b6',
        type: 'course',
      });

      // Event on monday: 08:00 - 09:30
      await store.addEvent('monday', {
        title: 'Clase Nueva',
        startTime: '08:00',
        endTime: '09:30',
        color: '#3498db',
        type: 'course',
      });

      const newId = useTimetableStore.getState().data.monday.events[0].id;
      // Move to tuesday at 10:00 (duration 90m -> 10:00 - 11:30)
      await store.moveEvent('monday', 'tuesday', newId, '10:00', '11:30');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with push
      await store.resolveConflict('push');

      const state = useTimetableStore.getState();
      expect(state.conflictState).toBeNull();
      expect(state.data.monday.events.length).toBe(0);
      expect(state.data.tuesday.events.length).toBe(3);

      // Clase Nueva at 10:00 - 11:30
      expect(state.data.tuesday.events[0].title).toBe('Clase Nueva');
      expect(state.data.tuesday.events[0].startTime).toBe('10:00');
      expect(state.data.tuesday.events[0].endTime).toBe('11:30');

      // Clase A pushed to 11:30 - 13:00 (90 min duration maintained)
      expect(state.data.tuesday.events[1].title).toBe('Clase A');
      expect(state.data.tuesday.events[1].startTime).toBe('11:30');
      expect(state.data.tuesday.events[1].endTime).toBe('13:00');

      // Clase B pushed to 13:00 - 14:00 (60 min duration maintained)
      expect(state.data.tuesday.events[2].title).toBe('Clase B');
      expect(state.data.tuesday.events[2].startTime).toBe('13:00');
      expect(state.data.tuesday.events[2].endTime).toBe('14:00');
    });

    it('resolves conflict using swap: cleanly swaps events between different days', async () => {
      const store = useTimetableStore.getState();
      // Monday: Artes 08:00 - 09:30
      await store.addEvent('monday', {
        title: 'Artes',
        startTime: '08:00',
        endTime: '09:30',
        color: '#9b59b6',
        type: 'course',
      });
      // Tuesday: Música 10:00 - 11:00
      await store.addEvent('tuesday', {
        title: 'Música',
        startTime: '10:00',
        endTime: '11:00',
        color: '#e74c3c',
        type: 'course',
      });

      const artesId = useTimetableStore.getState().data.monday.events[0].id;
      // Move Artes to Tuesday 10:00 - 11:30 -> conflict with Música
      await store.moveEvent('monday', 'tuesday', artesId, '10:00', '11:30');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with swap
      await store.resolveConflict('swap');

      const state = useTimetableStore.getState();
      expect(state.conflictState).toBeNull();
      // Artes is on Tuesday at 10:00 - 11:30
      expect(state.data.tuesday.events.length).toBe(1);
      expect(state.data.tuesday.events[0].title).toBe('Artes');
      expect(state.data.tuesday.events[0].startTime).toBe('10:00');
      expect(state.data.tuesday.events[0].endTime).toBe('11:30');

      // Música is on Monday at 08:00 - 09:00
      expect(state.data.monday.events.length).toBe(1);
      expect(state.data.monday.events[0].title).toBe('Música');
      expect(state.data.monday.events[0].startTime).toBe('08:00');
      expect(state.data.monday.events[0].endTime).toBe('09:00');
    });

    it('resolves conflict using swap on the SAME day with adjacent blocks of different durations (Ciencias + Recreo case)', async () => {
      const store = useTimetableStore.getState();
      // Setup Tuesday with Recreo (30m), Ciencias (90m), Matemáticas (90m)
      await store.addEvent('tuesday', {
        title: 'Recreo',
        startTime: '09:45',
        endTime: '10:15',
        color: '#78909c',
        type: 'break',
      });
      await store.addEvent('tuesday', {
        title: 'Ciencias',
        startTime: '10:15',
        endTime: '11:45',
        color: '#3498db',
        type: 'course',
      });
      await store.addEvent('tuesday', {
        title: 'Matemáticas',
        startTime: '11:45',
        endTime: '13:15',
        color: '#1abc9c',
        type: 'course',
      });

      const cienciasId = useTimetableStore.getState().data.tuesday.events[1].id;

      // Drag Ciencias upwards over Recreo to 09:45 - 11:15
      await store.moveEvent('tuesday', 'tuesday', cienciasId, '09:45', '11:15');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with swap
      await store.resolveConflict('swap');

      const state = useTimetableStore.getState();
      expect(state.conflictState).toBeNull();
      const events = state.data.tuesday.events;
      expect(events.length).toBe(3);

      // 1. Ciencias is now first: 09:45 - 11:15
      expect(events[0].title).toBe('Ciencias');
      expect(events[0].startTime).toBe('09:45');
      expect(events[0].endTime).toBe('11:15');

      // 2. Recreo is now second: 11:15 - 11:45
      expect(events[1].title).toBe('Recreo');
      expect(events[1].startTime).toBe('11:15');
      expect(events[1].endTime).toBe('11:45');

      // 3. Matemáticas remains third: 11:45 - 13:15
      expect(events[2].title).toBe('Matemáticas');
      expect(events[2].startTime).toBe('11:45');
      expect(events[2].endTime).toBe('13:15');

      // ABSOLUTE ZERO OVERLAPS: Each block starts >= previous block's end
      expect(events[1].startTime >= events[0].endTime).toBe(true);
      expect(events[2].startTime >= events[1].endTime).toBe(true);
    });

    it('resolves conflict using swap between days with duration disparity pushing subsequent blocks safely', async () => {
      const store = useTimetableStore.getState();
      // Monday: Ciencias (90m) at 08:00 - 09:30
      await store.addEvent('monday', {
        title: 'Ciencias',
        startTime: '08:00',
        endTime: '09:30',
        color: '#3498db',
        type: 'course',
      });

      // Tuesday: Recreo (30m) at 10:00 - 10:30, Matemáticas (90m) at 10:30 - 12:00
      await store.addEvent('tuesday', {
        title: 'Recreo',
        startTime: '10:00',
        endTime: '10:30',
        color: '#78909c',
        type: 'break',
      });
      await store.addEvent('tuesday', {
        title: 'Matemáticas',
        startTime: '10:30',
        endTime: '12:00',
        color: '#1abc9c',
        type: 'course',
      });

      const cienciasId = useTimetableStore.getState().data.monday.events[0].id;
      // Move Ciencias to Tuesday at 10:00 - 11:30 -> conflict with Recreo
      await store.moveEvent('monday', 'tuesday', cienciasId, '10:00', '11:30');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with swap
      await store.resolveConflict('swap');

      const state = useTimetableStore.getState();
      // Monday has Recreo at 08:00 - 08:30
      expect(state.data.monday.events.length).toBe(1);
      expect(state.data.monday.events[0].title).toBe('Recreo');
      expect(state.data.monday.events[0].startTime).toBe('08:00');
      expect(state.data.monday.events[0].endTime).toBe('08:30');

      // Tuesday has Ciencias at 10:00 - 11:30, and Matemáticas pushed to 11:30 - 13:00
      expect(state.data.tuesday.events.length).toBe(2);
      expect(state.data.tuesday.events[0].title).toBe('Ciencias');
      expect(state.data.tuesday.events[0].startTime).toBe('10:00');
      expect(state.data.tuesday.events[0].endTime).toBe('11:30');

      expect(state.data.tuesday.events[1].title).toBe('Matemáticas');
      expect(state.data.tuesday.events[1].startTime).toBe('11:30');
      expect(state.data.tuesday.events[1].endTime).toBe('13:00');

      // Absolutely zero overlap on Tuesday
      expect(state.data.tuesday.events[1].startTime >= state.data.tuesday.events[0].endTime).toBe(true);
    });

    it('resolves conflict using fit: shortens incoming block to fit free gap without moving existing event', async () => {
      const store = useTimetableStore.getState();
      // Existing event on tuesday: 10:00 - 11:30
      await store.addEvent('tuesday', {
        title: 'Existente',
        startTime: '10:00',
        endTime: '11:30',
        color: '#e67e22',
        type: 'course',
      });

      // New block starting at 09:00 - 10:30 (overlaps 10:00 - 10:30)
      await store.addEvent('monday', {
        title: 'Nuevo Bloque',
        startTime: '08:00',
        endTime: '09:30',
        color: '#3498db',
        type: 'course',
      });

      const newId = useTimetableStore.getState().data.monday.events[0].id;
      await store.moveEvent('monday', 'tuesday', newId, '09:00', '10:30');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with fit
      await store.resolveConflict('fit');

      const state = useTimetableStore.getState();
      expect(state.conflictState).toBeNull();
      expect(state.data.monday.events.length).toBe(0);
      expect(state.data.tuesday.events.length).toBe(2);

      // Nuevo Bloque fitted before Existente: 09:00 - 10:00 (shortened by 30 min)
      expect(state.data.tuesday.events[0].title).toBe('Nuevo Bloque');
      expect(state.data.tuesday.events[0].startTime).toBe('09:00');
      expect(state.data.tuesday.events[0].endTime).toBe('10:00');

      // Existente untouched at 10:00 - 11:30
      expect(state.data.tuesday.events[1].title).toBe('Existente');
      expect(state.data.tuesday.events[1].startTime).toBe('10:00');
      expect(state.data.tuesday.events[1].endTime).toBe('11:30');
    });

    it('handles push cascades that push blocks past regular endMinutes preserving configured hours', async () => {
      const store = useTimetableStore.getState();
      // Configure Monday hours: 08:00 (480) - 17:00 (1020)
      expect(store.data.monday.endMinutes).toBe(1020);

      // Existing event near end of day: 16:00 - 17:00
      await store.addEvent('monday', {
        title: 'Taller Final',
        startTime: '16:00',
        endTime: '17:00',
        color: '#e67e22',
        type: 'course',
      });

      // New block 15:30 - 17:00 (90 min)
      await store.addEvent('tuesday', {
        title: 'Ciencias Tarde',
        startTime: '08:00',
        endTime: '09:30',
        color: '#3498db',
        type: 'course',
      });

      const newId = useTimetableStore.getState().data.tuesday.events[0].id;
      await store.moveEvent('tuesday', 'monday', newId, '15:30', '17:00');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with push
      await store.resolveConflict('push');

      const state = useTimetableStore.getState();
      expect(state.conflictState).toBeNull();
      const events = state.data.monday.events;
      expect(events.length).toBe(2);

      // Ciencias Tarde is at 15:30 - 17:00
      expect(events[0].title).toBe('Ciencias Tarde');
      expect(events[0].startTime).toBe('15:30');
      expect(events[0].endTime).toBe('17:00');

      // Taller Final was pushed past 17:00 to 17:00 - 18:00
      expect(events[1].title).toBe('Taller Final');
      expect(events[1].startTime).toBe('17:00');
      expect(events[1].endTime).toBe('18:00');

      // The configured day schedule remains 1020 (17:00), not overwritten
      expect(state.data.monday.endMinutes).toBe(1020);
      // Zero overlaps
      expect(events[1].startTime >= events[0].endTime).toBe(true);
    });

    it('safely clamps cascades near midnight (1439 min) without collapsing to 0-minute artifacts', async () => {
      const store = useTimetableStore.getState();
      // Add existing event very late: 23:00 - 23:45
      await store.addEvent('friday', {
        title: 'Evento Nocturno',
        startTime: '23:00',
        endTime: '23:45',
        color: '#8e44ad',
        type: 'course',
      });

      // Incoming event placed at 22:30 - 23:30 (overlaps)
      await store.addEvent('monday', {
        title: 'Extensión Extra',
        startTime: '08:00',
        endTime: '09:00',
        color: '#2980b9',
        type: 'course',
      });

      const newId = useTimetableStore.getState().data.monday.events[0].id;
      await store.moveEvent('monday', 'friday', newId, '22:30', '23:30');
      expect(useTimetableStore.getState().conflictState?.isOpen).toBe(true);

      // Resolve with push
      await store.resolveConflict('push');

      const state = useTimetableStore.getState();
      const events = state.data.friday.events;
      expect(events.length).toBe(2);

      // Extensión Extra at 22:30 - 23:30
      expect(events[0].title).toBe('Extensión Extra');
      expect(events[0].startTime).toBe('22:30');
      expect(events[0].endTime).toBe('23:30');

      // Evento Nocturno pushed to 23:30 - 23:59 (clamped before midnight)
      expect(events[1].title).toBe('Evento Nocturno');
      expect(events[1].startTime).toBe('23:30');
      expect(events[1].endTime).toBe('23:59');

      // Zero overlap
      expect(events[1].startTime >= events[0].endTime).toBe(true);
    });
  });
});
