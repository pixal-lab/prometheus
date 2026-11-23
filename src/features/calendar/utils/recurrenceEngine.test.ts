import { describe, it, expect } from 'vitest';
import { expandRecurringEvents } from './recurrenceEngine';
import { ClassBlock } from '../../../core/types/calendar.types';

describe('Recurrence Engine Unit Tests', () => {
  it('expands daily recurrence for a specified number of occurrences', () => {
    const block: ClassBlock = {
      id: 'block-1',
      subject: 'Matemáticas',
      topic: 'Geometría',
      date: '2026-03-02',
      isRecurring: true,
      recurrenceRule: {
        type: 'daily',
        ends: 'afterOccurrences',
        occurrences: 5,
      },
    };

    const expanded = expandRecurringEvents([block], '2026-03-01', '2026-03-10');
    expect(expanded.length).toBe(5);
    expect(expanded[0].date).toBe('2026-03-02');
    expect(expanded[1].date).toBe('2026-03-03');
    expect(expanded[2].date).toBe('2026-03-04');
    expect(expanded[3].date).toBe('2026-03-05');
    expect(expanded[4].date).toBe('2026-03-06');
  });

  it('expands weekly recurrence with 7 days between events', () => {
    const block: ClassBlock = {
      id: 'block-w',
      subject: 'Ciencias',
      topic: 'Laboratorio',
      date: '2026-03-02', // Monday
      isRecurring: true,
      recurrenceRule: {
        type: 'weekly',
        ends: 'afterOccurrences',
        occurrences: 3,
      },
    };

    const expanded = expandRecurringEvents([block], '2026-03-01', '2026-03-31');
    expect(expanded.length).toBe(3);
    expect(expanded[0].date).toBe('2026-03-02');
    expect(expanded[1].date).toBe('2026-03-09');
    expect(expanded[2].date).toBe('2026-03-16');
  });

  it('expands multi-day weekly recurrence (Monday, Wednesday, Friday)', () => {
    const block: ClassBlock = {
      id: 'block-multi',
      subject: 'Inglés',
      topic: 'Speaking Workshop',
      date: '2026-03-02', // Monday
      isRecurring: true,
      recurrenceRule: {
        type: 'weekly',
        ends: 'afterOccurrences',
        occurrences: 5,
        days: [1, 3, 5], // Mon, Wed, Fri
      },
    };

    const expanded = expandRecurringEvents([block], '2026-03-01', '2026-03-31');
    expect(expanded.length).toBe(5);
    expect(expanded[0].date).toBe('2026-03-02'); // Mon
    expect(expanded[1].date).toBe('2026-03-04'); // Wed
    expect(expanded[2].date).toBe('2026-03-06'); // Fri
    expect(expanded[3].date).toBe('2026-03-09'); // Mon next week
    expect(expanded[4].date).toBe('2026-03-11'); // Wed next week
  });

  it('expands yearly recurrence correctly', () => {
    const block: ClassBlock = {
      id: 'block-yearly',
      subject: 'Colegio',
      topic: 'Aniversario Institucional',
      date: '2026-04-10',
      isRecurring: true,
      recurrenceRule: {
        type: 'yearly',
        ends: 'afterOccurrences',
        occurrences: 3,
      },
    };

    const expanded = expandRecurringEvents([block], '2026-01-01', '2029-01-01');
    expect(expanded.length).toBe(3);
    expect(expanded[0].date).toBe('2026-04-10');
    expect(expanded[1].date).toBe('2027-04-10');
    expect(expanded[2].date).toBe('2028-04-10');
  });

  it('retains non-recurring blocks unchanged if inside date range', () => {
    const block: ClassBlock = {
      id: 'block-single',
      subject: 'Historia',
      topic: 'Revolución',
      date: '2026-03-15',
    };

    const expanded = expandRecurringEvents([block], '2026-03-01', '2026-03-31');
    expect(expanded.length).toBe(1);
    expect(expanded[0].id).toBe('block-single');
  });
});

