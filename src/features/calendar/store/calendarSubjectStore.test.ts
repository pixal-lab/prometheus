import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCalendarStore } from './useCalendarStore';

describe('useCalendarStore - Subject and Course management', () => {
  beforeEach(() => {
    useCalendarStore.setState({
      classBlocks: [],
      subjects: {
        'Matemáticas': { color: '#1abc9c', visible: true, availableDays: ['L', 'M', 'X', 'J', 'V'] },
        'Historia': { color: '#e67e22', visible: true, availableDays: ['M', 'J'] },
      },
      subjectOrder: ['Matemáticas', 'Historia'],
      undoStack: [],
      redoStack: [],
    });
  });

  it('adds and updates course configuration', async () => {
    const store = useCalendarStore.getState();
    await store.setSubject('Filosofía', {
      color: '#9b59b6',
      visible: true,
      availableDays: ['L', 'X', 'V'],
    });

    const state = useCalendarStore.getState();
    expect(state.subjects['Filosofía']).toBeDefined();
    expect(state.subjects['Filosofía'].color).toBe('#9b59b6');
    expect(state.subjects['Filosofía'].availableDays).toEqual(['L', 'X', 'V']);
    expect(state.subjectOrder).toContain('Filosofía');
  });

  it('deletes course, cleans up subjectOrder and removes linked classBlocks', async () => {
    useCalendarStore.setState({
      classBlocks: [
        { id: 'b-1', subject: 'Matemáticas', topic: 'Álgebra', date: '2026-03-02', color: '#1abc9c' },
        { id: 'b-2', subject: 'Historia', topic: 'Edad Media', date: '2026-03-03', color: '#e67e22' },
      ],
    });

    const store = useCalendarStore.getState();
    await store.deleteSubject('Matemáticas');

    const state = useCalendarStore.getState();
    expect(state.subjects['Matemáticas']).toBeUndefined();
    expect(state.subjectOrder).not.toContain('Matemáticas');
    expect(state.subjectOrder).toContain('Historia');

    // Associated block should be removed
    expect(state.classBlocks.some(b => b.subject === 'Matemáticas')).toBe(false);
    expect(state.classBlocks.some(b => b.subject === 'Historia')).toBe(true);

    // Can undo deletion
    store.undo();
    const undoneState = useCalendarStore.getState();
    expect(undoneState.classBlocks.some(b => b.subject === 'Matemáticas')).toBe(true);
  });

  it('renames course and updates subjectOrder and associated blocks', async () => {
    useCalendarStore.setState({
      classBlocks: [
        { id: 'b-1', subject: 'Historia', topic: 'Edad Media', date: '2026-03-03', color: '#e67e22' },
      ],
    });

    const store = useCalendarStore.getState();
    await store.renameSubject('Historia', 'Historia Universal');

    const state = useCalendarStore.getState();
    expect(state.subjects['Historia']).toBeUndefined();
    expect(state.subjects['Historia Universal']).toBeDefined();
    expect(state.subjects['Historia Universal'].color).toBe('#e67e22');
    expect(state.subjectOrder).toContain('Historia Universal');
    expect(state.subjectOrder).not.toContain('Historia');

    const updatedBlock = state.classBlocks.find(b => b.id === 'b-1');
    expect(updatedBlock?.subject).toBe('Historia Universal');
  });
});
