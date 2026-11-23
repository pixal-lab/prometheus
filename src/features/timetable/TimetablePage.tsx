import React, { useEffect, useState, useMemo } from 'react';
import { useTimetableStore } from './store/useTimetableStore';
import { useCalendarStore } from '../calendar/store/useCalendarStore';
import { TimetableGrid } from './components/TimetableGrid';
import { ConflictModal } from './components/ConflictModal';
import { EditBlockModal } from './components/EditBlockModal';
import { DayHoursModal } from './components/DayHoursModal';
import { TimetableContextMenu } from './components/TimetableContextMenu';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { TimetableEvent, DayOfWeek, TimetableBlockType } from '../../core/types/timetable.types';
import {
  Printer,
  Plus,
  Clock,
  Coffee,
  Utensils,
  BookOpen,
  Sparkles,
  Undo2,
  Redo2,
  Trash2,
  SlidersHorizontal,
  GraduationCap,
  GripVertical,
} from 'lucide-react';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useToast } from '../../components/ui/Toast';

export const TimetablePage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    data,
    nonCourseConfigs,
    loadData,
    addEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    moveEvent,
    clearTimetable,
    undo,
    redo,
    undoStack,
    redoStack,
    isLoading,
    setDraggedPaletteItem,
  } = useTimetableStore();

  const { subjects, subjectOrder, loadData: loadCalendarData } = useCalendarStore();

  const [selectedBlock, setSelectedBlock] = useState<{ day: DayOfWeek; event: TimetableEvent } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDayHoursModalOpen, setIsDayHoursModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    day: DayOfWeek;
    event: TimetableEvent;
  } | null>(null);

  useEffect(() => {
    loadData();
    loadCalendarData();
  }, [loadData, loadCalendarData]);

  // Global keyboard shortcuts: Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleBlockClick = (day: DayOfWeek, event: TimetableEvent) => {
    setSelectedBlock({ day, event });
    setIsEditModalOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, day: DayOfWeek, event: TimetableEvent) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      day,
      event,
    });
  };

  const handleTimeSlotClick = async (day: DayOfWeek, timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const endMinutes = Math.min(1439, h * 60 + m + 90); // Default 1h30m block
    const endH = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    await addEvent(day, {
      title: 'Nueva Asignatura',
      startTime: timeStr,
      endTime: endTimeStr,
      color: '#1abc9c',
      type: 'course',
    });

    const dayEnd = data[day]?.endMinutes ?? 1020;
    if (endMinutes > dayEnd) {
      showToast(`Bloque añadido (extiende la jornada hasta las ${endTimeStr})`, 'warning');
    } else {
      showToast('Bloque añadido', 'info');
    }
  };

  const handleDropSubject = async (
    day: DayOfWeek,
    timeStr: string,
    subjectTitle: string,
    color: string,
    type: TimetableBlockType
  ) => {
    const [h, m] = timeStr.split(':').map(Number);
    const duration = type === 'break' ? 30 : type === 'lunch' ? 60 : 90;
    const endMinutes = Math.min(1439, h * 60 + m + duration);
    const endH = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    await addEvent(day, {
      title: subjectTitle,
      startTime: timeStr,
      endTime: endTimeStr,
      color,
      type,
    });

    const dayEnd = data[day]?.endMinutes ?? 1020;
    if (endMinutes > dayEnd) {
      showToast(`Bloque de "${subjectTitle}" añadido (extiende la jornada hasta las ${endTimeStr})`, 'warning');
    } else {
      showToast(`Bloque de "${subjectTitle}" añadido en ${day}`, 'success');
    }
  };

  const handleAddQuickBlock = async (type: TimetableBlockType, title: string, durationMinutes = 45) => {
    const day: DayOfWeek = 'monday';
    const startTime = '08:00';
    const [h, m] = startTime.split(':').map(Number);
    const endMinutes = Math.min(1439, h * 60 + m + durationMinutes);
    const endH = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    await addEvent(day, {
      title,
      startTime,
      endTime,
      color: nonCourseConfigs[type] || '#3b82f6',
      type,
    });

    const dayEnd = data[day]?.endMinutes ?? 1020;
    if (endMinutes > dayEnd) {
      showToast(`Bloque "${title}" añadido (extiende la jornada hasta las ${endTime})`, 'warning');
    } else {
      showToast(`Bloque "${title}" añadido`, 'info');
    }
  };

  // Ordered list of subjects from Calendar store
  const orderedSubjects = useMemo(() => {
    const list: { name: string; color: string }[] = [];
    const names = subjectOrder.length > 0 ? subjectOrder : Object.keys(subjects);
    for (const name of names) {
      if (subjects[name]) {
        list.push({ name, color: subjects[name].color });
      }
    }
    return list;
  }, [subjects, subjectOrder]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-slate-400">Cargando horario semanal...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            🕒 {t('timetable_title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Grilla horaria interactiva. Arrastra asignaturas o bloques a cualquier celda o haz doble clic para añadir.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Undo / Redo */}
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs mr-1">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Deshacer (Ctrl + Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Rehacer (Ctrl + Y)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <Button
            onClick={() => setIsDayHoursModalOpen(true)}
            variant="outline"
            size="sm"
            title="Configurar horas de inicio y fin"
          >
            <SlidersHorizontal size={15} /> Horas de Días
          </Button>

          <Button
            onClick={() => setIsClearModalOpen(true)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
            title="Borrar todos los eventos del horario"
          >
            <Trash2 size={15} /> Vaciar Horario
          </Button>

          <Button onClick={() => window.print()} variant="outline" size="sm" title="Imprimir horario">
            <Printer size={15} /> Imprimir
          </Button>

          <Button
            onClick={() => handleTimeSlotClick('monday', '08:00')}
            variant="primary"
            size="sm"
          >
            <Plus size={15} /> Añadir Bloque
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Palette of Draggable Subjects & Blocks */}
        <div className="flex flex-col gap-4 print:hidden">
          {/* Subjects Palette */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <GraduationCap size={15} className="text-orange-600" />
                Asignaturas del Curso
              </h3>
              <span className="text-[10px] text-slate-400">Arrastrable</span>
            </div>
            <p className="text-xs text-slate-400">
              Arrastra una asignatura a cualquier día y hora de la grilla:
            </p>

            <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
              {orderedSubjects.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No hay asignaturas configuradas</span>
              ) : (
                orderedSubjects.map(sub => (
                  <div
                    key={sub.name}
                    draggable
                    onDragStart={e => {
                      setDraggedPaletteItem({ title: sub.name, color: sub.color, type: 'course', durationMinutes: 90 });
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({ title: sub.name, color: sub.color, type: 'course' })
                      );
                    }}
                    onDragEnd={() => setDraggedPaletteItem(null)}
                    onClick={() => handleDropSubject('monday', '08:00', sub.name, sub.color, 'course')}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-grab active:cursor-grabbing text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors select-none group"
                    title="Arrastra a la grilla o pulsa para añadir en lunes 08:00"
                  >
                    <GripVertical size={13} className="text-slate-400 group-hover:text-slate-600" />
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: sub.color }} />
                    <span className="truncate">{sub.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Non-Course Blocks Palette */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Bloques No Lectivos
            </h3>
            <p className="text-xs text-slate-400">
              Arrastra o pulsa para añadir a la jornada:
            </p>

            <div className="flex flex-col gap-2">
              <div
                draggable
                onDragStart={e => {
                  setDraggedPaletteItem({ title: 'Recreo', color: nonCourseConfigs.break, type: 'break', durationMinutes: 30 });
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ title: 'Recreo', color: nonCourseConfigs.break, type: 'break' })
                  );
                }}
                onDragEnd={() => setDraggedPaletteItem(null)}
                onClick={() => handleAddQuickBlock('break', 'Recreo', 30)}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-grab active:cursor-grabbing text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors select-none"
              >
                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: nonCourseConfigs.break }} />
                <Coffee size={15} className="text-slate-500" />
                <span>Recreo (30 min)</span>
              </div>

              <div
                draggable
                onDragStart={e => {
                  setDraggedPaletteItem({ title: 'Almuerzo', color: nonCourseConfigs.lunch, type: 'lunch', durationMinutes: 60 });
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ title: 'Almuerzo', color: nonCourseConfigs.lunch, type: 'lunch' })
                  );
                }}
                onDragEnd={() => setDraggedPaletteItem(null)}
                onClick={() => handleAddQuickBlock('lunch', 'Almuerzo', 60)}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-grab active:cursor-grabbing text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors select-none"
              >
                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: nonCourseConfigs.lunch }} />
                <Utensils size={15} className="text-slate-500" />
                <span>Almuerzo (1 hora)</span>
              </div>

              <div
                draggable
                onDragStart={e => {
                  setDraggedPaletteItem({ title: 'Planificación', color: nonCourseConfigs.planning, type: 'planning', durationMinutes: 90 });
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ title: 'Planificación', color: nonCourseConfigs.planning, type: 'planning' })
                  );
                }}
                onDragEnd={() => setDraggedPaletteItem(null)}
                onClick={() => handleAddQuickBlock('planning', 'Planificación', 90)}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-grab active:cursor-grabbing text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors select-none"
              >
                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: nonCourseConfigs.planning }} />
                <BookOpen size={15} className="text-slate-500" />
                <span>Planificación</span>
              </div>

              <div
                draggable
                onDragStart={e => {
                  setDraggedPaletteItem({ title: 'Taller Especial', color: nonCourseConfigs.special, type: 'special', durationMinutes: 60 });
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({ title: 'Taller Especial', color: nonCourseConfigs.special, type: 'special' })
                  );
                }}
                onDragEnd={() => setDraggedPaletteItem(null)}
                onClick={() => handleAddQuickBlock('special', 'Taller Especial', 60)}
                className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-grab active:cursor-grabbing text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors select-none"
              >
                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: nonCourseConfigs.special }} />
                <Sparkles size={15} className="text-slate-500" />
                <span>Clase Especial</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-2xl text-xs text-orange-900 dark:text-orange-200 flex items-start gap-2.5">
            <Clock size={16} className="shrink-0 text-orange-600 mt-0.5" />
            <p>
              <strong>Atajos:</strong> Haz clic derecho sobre cualquier bloque del horario para editarlo, duplicarlo o eliminarlo. Usa <kbd className="font-mono bg-orange-100 dark:bg-orange-900 px-1 rounded">Ctrl + Z</kbd> para deshacer.
            </p>
          </div>
        </div>

        {/* Right Side: Interactive Weekly Grid */}
        <div className="lg:col-span-3">
          <TimetableGrid
            data={data}
            onBlockClick={handleBlockClick}
            onTimeSlotClick={handleTimeSlotClick}
            onContextMenu={handleContextMenu}
            onDropSubject={handleDropSubject}
            onMoveBlock={async (fromDay, toDay, eventId, newStartTime, newEndTime) => {
              await moveEvent(fromDay, toDay, eventId, newStartTime, newEndTime);
            }}
            onResizeBlock={async (day, eventId, newEndTime) => {
              await updateEvent(day, eventId, { endTime: newEndTime });
              showToast('Duración de bloque actualizada', 'info');
            }}
          />
        </div>
      </div>

      <ConflictModal />

      {selectedBlock && (
        <EditBlockModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBlock(null);
          }}
          day={selectedBlock.day}
          event={selectedBlock.event}
        />
      )}

      {isDayHoursModalOpen && (
        <DayHoursModal
          isOpen={isDayHoursModalOpen}
          onClose={() => setIsDayHoursModalOpen(false)}
        />
      )}

      {contextMenu && (
        <TimetableContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          day={contextMenu.day}
          event={contextMenu.event}
          onClose={() => setContextMenu(null)}
          onEdit={(day, event) => {
            handleBlockClick(day, event);
            setContextMenu(null);
          }}
          onDuplicate={async (day, event) => {
            await duplicateEvent(day, event.id);
            showToast('Bloque duplicado', 'success');
            setContextMenu(null);
          }}
          onDelete={async (day, event) => {
            await deleteEvent(day, event.id);
            showToast('Bloque eliminado', 'info');
            setContextMenu(null);
          }}
        />
      )}

      {/* Clear Timetable Confirmation Modal */}
      {isClearModalOpen && (
        <Modal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          title="¿Vaciar Horario Completo?"
          maxWidth="sm"
        >
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              ¿Estás seguro de que deseas eliminar <strong>todos los bloques</strong> del horario semanal?
              Esta acción se puede deshacer con <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">Ctrl + Z</kbd>.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button onClick={() => setIsClearModalOpen(false)} variant="ghost" size="sm">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  await clearTimetable();
                  setIsClearModalOpen(false);
                  showToast('Horario vaciado correctamente', 'info');
                }}
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={15} /> Confirmar y Vaciar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
