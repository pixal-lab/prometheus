import { storage } from './dexieStorage';
import { logger } from '../debug/logger';

export interface FullBackupData {
  version: string;
  timestamp: string;
  classBlocks?: any[];
  subjects?: Record<string, any>;
  subjectOrder?: string[];
  schoolYears?: any[];
  activeSchoolYearId?: number | null;
  calendarDayTypes?: Record<string, any>;
  dayColorPalette?: any[];
  hemisphere?: string;
  timetableData?: any;
  timetableNonCourseColors?: Record<string, string>;
  lessonPlannerData?: any;
  gradebookData?: any;
}

export class BackupService {
  /**
   * Genera el objeto completo con toda la data de la suite y dispara la descarga del archivo .json
   */
  static async exportFullBackup(filename?: string): Promise<void> {
    try {
      const data: FullBackupData = {
        version: '3.0.0-react',
        timestamp: new Date().toISOString(),
        classBlocks: (await storage.getItem('classBlocks')) || [],
        subjects: (await storage.getItem('subjects')) || {},
        subjectOrder: (await storage.getItem('subjectOrder')) || [],
        schoolYears: (await storage.getItem('schoolYears')) || [],
        activeSchoolYearId: await storage.getItem('activeSchoolYearId'),
        calendarDayTypes: (await storage.getItem('calendarDayTypes')) || {},
        dayColorPalette: (await storage.getItem('dayColorPalette')) || [],
        hemisphere: localStorage.getItem('hemisphere') || 'south',
        timetableData: await storage.getItem('timetableData'),
        timetableNonCourseColors: (await storage.getItem<Record<string, string>>('timetableNonCourseColors')) || undefined,
        lessonPlannerData: await storage.getItem('lessonPlannerData'),
        gradebookData: await storage.getItem('gradebookData'),
      };

      const dateStr = new Date().toISOString().split('T')[0];
      const actualName = filename || `prometheus-backup-${dateStr}.json`;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = actualName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info('Storage', `Respaldo completo exportado exitosamente como ${actualName}`);
    } catch (err) {
      logger.error('Storage', 'Error al exportar respaldo', err);
      throw err;
    }
  }

  /**
   * Importa y restaura datos desde una cadena o archivo JSON, con compatibilidad retroactiva completa para Prometheus MVP
   */
  static async importBackup(jsonString: string): Promise<{ success: boolean; message: string; count: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      let count = 0;

      // 1. Bloques de clase
      if (parsed.classBlocks && Array.isArray(parsed.classBlocks)) {
        await storage.setItem('classBlocks', parsed.classBlocks);
        count += parsed.classBlocks.length;
      }

      // 2. Asignaturas y orden
      if (parsed.subjects && typeof parsed.subjects === 'object') {
        await storage.setItem('subjects', parsed.subjects);
      }

      if (parsed.subjectOrder && Array.isArray(parsed.subjectOrder)) {
        await storage.setItem('subjectOrder', parsed.subjectOrder);
      } else if (parsed.subjects && typeof parsed.subjects === 'object') {
        await storage.setItem('subjectOrder', Object.keys(parsed.subjects));
      }

      // 3. Años escolares
      if (parsed.schoolYears && Array.isArray(parsed.schoolYears)) {
        await storage.setItem('schoolYears', parsed.schoolYears);
      }

      if (parsed.activeSchoolYearId !== undefined) {
        await storage.setItem('activeSchoolYearId', parsed.activeSchoolYearId);
      }

      // 4. Tipos de jornada y colores de día (Soporte nuevo calendarDayTypes y legacy daySettings / dayColorPalette)
      const dayTypes: Record<string, any> = { ...(parsed.calendarDayTypes || {}) };
      if (parsed.daySettings && typeof parsed.daySettings === 'object') {
        for (const [date, val] of Object.entries(parsed.daySettings as Record<string, any>)) {
          if (val && typeof val === 'object') {
            dayTypes[date] = {
              date,
              type: val.type || 'custom',
              note: val.note || '',
              color: val.color || undefined,
            };
          }
        }
      }
      if (Object.keys(dayTypes).length > 0) {
        await storage.setItem('calendarDayTypes', dayTypes);
      }

      if (parsed.dayColorPalette && Array.isArray(parsed.dayColorPalette)) {
        await storage.setItem('dayColorPalette', parsed.dayColorPalette);
      }

      // 5. Horario (Soporte timetableData y legacy timetable con mayúsculas/minúsculas)
      const rawTimetable = parsed.timetableData || parsed.timetable;
      if (rawTimetable && typeof rawTimetable === 'object') {
        const normalizedTimetable: Record<string, any> = {};
        const daysMap: Record<string, string> = {
          monday: 'monday',
          tuesday: 'tuesday',
          wednesday: 'wednesday',
          thursday: 'thursday',
          friday: 'friday',
          Monday: 'monday',
          Tuesday: 'tuesday',
          Wednesday: 'wednesday',
          Thursday: 'thursday',
          Friday: 'friday',
          lunes: 'monday',
          Lunes: 'monday',
          martes: 'tuesday',
          Martes: 'tuesday',
          miercoles: 'wednesday',
          Miercoles: 'wednesday',
          miércoles: 'wednesday',
          Miércoles: 'wednesday',
          jueves: 'thursday',
          Jueves: 'thursday',
          viernes: 'friday',
          Viernes: 'friday',
        };

        for (const [rawDay, dayData] of Object.entries(rawTimetable)) {
          const targetDay = daysMap[rawDay] || rawDay.toLowerCase();
          if (dayData && typeof dayData === 'object') {
            normalizedTimetable[targetDay] = {
              startMinutes: (dayData as any).startMinutes ?? 480,
              endMinutes: (dayData as any).endMinutes ?? 1020,
              events: (dayData as any).events || [],
            };
          }
        }

        // Asegurar que los 5 días de la semana existan
        for (const d of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']) {
          if (!normalizedTimetable[d]) {
            normalizedTimetable[d] = { startMinutes: 480, endMinutes: 1020, events: [] };
          }
        }

        await storage.setItem('timetableData', normalizedTimetable);
      }

      // 6. Colores de bloques no lectivos
      if (parsed.timetableNonCourseColors) {
        await storage.setItem('timetableNonCourseColors', parsed.timetableNonCourseColors);
      } else if (parsed.nonCourseBlockTypes && typeof parsed.nonCourseBlockTypes === 'object') {
        const nonCourseColors: Record<string, string> = {};
        for (const [key, val] of Object.entries(parsed.nonCourseBlockTypes as Record<string, any>)) {
          if (typeof val === 'string') nonCourseColors[key] = val;
          else if (val && typeof val === 'object' && val.color) nonCourseColors[key] = val.color;
        }
        await storage.setItem('timetableNonCourseColors', nonCourseColors);
      }

      // 7. Hemisferio
      if (parsed.hemisphere) {
        localStorage.setItem('hemisphere', parsed.hemisphere);
      }

      // 8. Planificador de lecciones
      if (parsed.lessonPlannerData) {
        await storage.setItem('lessonPlannerData', parsed.lessonPlannerData);
      }

      // 9. Libro de clases
      if (parsed.gradebookData) {
        await storage.setItem('gradebookData', parsed.gradebookData);
      }

      logger.info('Storage', `Respaldo importado correctamente. ${count} bloques de clase procesados.`);
      return { success: true, message: 'Datos importados con éxito.', count };
    } catch (err: any) {
      logger.error('Storage', 'Error crítico al importar archivo JSON', err);
      return { success: false, message: `Error al procesar el archivo: ${err.message}`, count: 0 };
    }
  }
}

