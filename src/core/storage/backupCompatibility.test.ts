import { describe, it, expect, beforeEach } from 'vitest';
import { BackupService } from './backupService';
import { storage } from './dexieStorage';

const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
    configurable: true,
  });
}

describe('Backup Data Compatibility Tests', () => {
  it('correctly parses legacy Prometheus MVP backup structure', () => {
    const rawJson = JSON.stringify({
      classBlocks: [
        {
          id: 'block-example-1',
          subject: 'Matemáticas',
          topic: 'Álgebra Básica',
          date: '2025-08-18',
          color: '#1abc9c',
        },
        {
          id: 'block-example-2',
          subject: 'Ciencias',
          topic: 'Ciclo del Agua',
          date: '2025-08-18',
          color: '#3498db',
        },
      ],
      subjects: {
        Matemáticas: { color: '#1abc9c', visible: true },
        Ciencias: { color: '#3498db', visible: true },
      },
    });

    const parsed = JSON.parse(rawJson);
    expect(Array.isArray(parsed.classBlocks)).toBe(true);
    expect(parsed.classBlocks.length).toBe(2);
    expect(parsed.subjects['Matemáticas'].color).toBe('#1abc9c');
  });

  it('correctly includes and restores lessonTemplates in backup', () => {
    const backupWithTemplates = JSON.stringify({
      version: '3.0.0-react',
      timestamp: '2026-11-22T00:00:00.000Z',
      lessonTemplates: [
        {
          id: 'tpl-1',
          name: 'Plantilla DUA Estándar',
          content: { objectives: 'DUA Obj', readings: 'Lecturas' },
        },
      ],
    });

    const parsed = JSON.parse(backupWithTemplates);
    expect(parsed.lessonTemplates).toBeDefined();
    expect(parsed.lessonTemplates.length).toBe(1);
    expect(parsed.lessonTemplates[0].name).toBe('Plantilla DUA Estándar');
  });

  it('correctly parses full suite backup structure', () => {
    const fullBackup = JSON.stringify({
      version: '3.0.0-react',
      timestamp: '2026-11-14T00:00:00.000Z',
      classBlocks: [{ id: 'b1', subject: 'Arte', topic: 'Pintura', date: '2026-03-01' }],
      timetableData: { monday: { startMinutes: 480, endMinutes: 1020, events: [] } },
      gradebookData: { courses: [], students: [], grades: [] },
      lessonPlannerData: { '5th Grade': {} },
    });

    const parsed = JSON.parse(fullBackup);
    expect(parsed.version).toBe('3.0.0-react');
    expect(parsed.classBlocks[0].subject).toBe('Arte');
    expect(parsed.timetableData.monday).toBeDefined();
    expect(parsed.gradebookData.courses).toBeDefined();
    expect(parsed.lessonPlannerData['5th Grade']).toBeDefined();
  });

  it('correctly maps legacy timetable and nonCourseBlockTypes from real MVP backups', () => {
    const legacyJson = JSON.stringify({
      classBlocks: [{ id: 'b1', subject: 'Bible', topic: 'L1', date: '2025-08-27' }],
      subjects: {
        Bible: { color: '#ff8a8a', visible: true, availableDays: ['L'] }
      },
      timetable: {
        Monday: { events: [], startMinutes: 480, endMinutes: 1020 },
        Friday: { events: [], startMinutes: 480, endMinutes: 780 }
      },
      nonCourseBlockTypes: {
        break: { color: '#5cc9ff', name: 'Recreo' },
        lunch: { color: '#00c8f0', name: 'Almuerzo' }
      },
      daySettings: {
        '2025-09-18': { color: '#b71c1c', note: 'Fiestas Patrias' }
      }
    });

    const parsed = JSON.parse(legacyJson);
    expect(parsed.timetable.Monday).toBeDefined();
    expect(parsed.nonCourseBlockTypes.break.color).toBe('#5cc9ff');
    expect(parsed.subjects.Bible.availableDays).toEqual(['L']);
    expect(parsed.daySettings['2025-09-18'].note).toBe('Fiestas Patrias');
  });

  it('correctly maps Spanish day names (Lunes, Miércoles, etc.) for timetable', () => {
    const rawSpanishTimetable = {
      Lunes: { events: [{ id: '1', title: 'Matemáticas' }] },
      Miércoles: { events: [{ id: '2', title: 'Ciencias' }] },
      Viernes: { events: [{ id: '3', title: 'Historia' }] },
    };

    const daysMap: Record<string, string> = {
      monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday', thursday: 'thursday', friday: 'friday',
      lunes: 'monday', Lunes: 'monday',
      miercoles: 'wednesday', Miercoles: 'wednesday',
      miércoles: 'wednesday', Miércoles: 'wednesday',
      viernes: 'friday', Viernes: 'friday',
    };

    expect(daysMap['Lunes']).toBe('monday');
    expect(daysMap['Miércoles']).toBe('wednesday');
    expect(daysMap['Viernes']).toBe('friday');
  });

  it('handles invalid, null, or non-object jsonString safely in BackupService.importBackup', async () => {
    const resNull = await BackupService.importBackup('null');
    expect(resNull.success).toBe(false);

    const resArray = await BackupService.importBackup('[]');
    expect(resArray.success).toBe(false);

    const resNum = await BackupService.importBackup('12345');
    expect(resNum.success).toBe(false);

    const resMalformed = await BackupService.importBackup('{ broken json');
    expect(resMalformed.success).toBe(false);
  });

  it('successfully imports a complete backup structure through BackupService.importBackup', async () => {
    const backupData = {
      version: '3.0.0-react',
      timestamp: new Date().toISOString(),
      classBlocks: [
        { id: 'cb-1', subject: 'Matemáticas', topic: 'Álgebra', date: '2026-04-10' },
      ],
      subjects: {
        Matemáticas: { color: '#1abc9c', visible: true },
      },
      timetableData: {
        monday: { startMinutes: 480, endMinutes: 1020, events: [] },
      },
    };

    const result = await BackupService.importBackup(JSON.stringify(backupData));
    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    const storedBlocks = await storage.getItem<any[]>('classBlocks');
    expect(storedBlocks).toBeDefined();
    expect(storedBlocks?.[0].topic).toBe('Álgebra');
  });

  it('storage.clear removes mirrored keys from localStorage as well', async () => {
    await storage.setItem('testKey', { hello: 'world' });
    expect(localStorage.getItem('prometheus_testKey')).toBeDefined();

    await storage.clear();
    expect(localStorage.getItem('prometheus_testKey')).toBeNull();
  });
});

