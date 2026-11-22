import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';
import { useTimetableStore } from '../../features/timetable/store/useTimetableStore';
import { useGradebookStore } from '../../features/gradebook/store/useGradebookStore';
import { useLessonPlannerStore } from '../../features/lesson-planner/store/useLessonPlannerStore';
import { logger } from '../debug/logger';

/**
 * Rehidrata todos los stores de Zustand en memoria leyendo los datos persistidos en Dexie IndexedDB.
 * Esencial al restaurar copias de seguridad o importar datos externos para que la UI se actualice sin recargar la página.
 */
export const reloadAllStores = async (): Promise<void> => {
  try {
    await Promise.allSettled([
      useCalendarStore.getState().loadData(),
      useTimetableStore.getState().loadData(),
      useGradebookStore.getState().loadData(),
      useLessonPlannerStore.getState().loadData(),
    ]);
    logger.info('Storage', 'Todos los stores rehidratados exitosamente en memoria.');
  } catch (err) {
    logger.error('Storage', 'Error rehidratando stores', err);
  }
};
