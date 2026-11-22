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
});
