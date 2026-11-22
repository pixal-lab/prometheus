import React from 'react';
import dayjs from 'dayjs';
import { ClassBlock, SubjectConfig, DayTypeInfo } from '../../../../core/types/calendar.types';
import { Plus, Award, BookOpen, Clock, Calendar, Edit3, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';

interface DayViewProps {
  currentDate: string;
  blocks: ClassBlock[];
  subjects: Record<string, SubjectConfig>;
  dayTypes: Record<string, DayTypeInfo>;
  onEventClick: (event: ClassBlock) => void;
  onAddEventClick: (date: string) => void;
  onDayClick: (date: string) => void;
  onContextMenu?: (e: React.MouseEvent, block: ClassBlock) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  blocks,
  subjects,
  dayTypes,
  onEventClick,
  onAddEventClick,
  onDayClick,
  onContextMenu,
}) => {
  const current = dayjs(currentDate);
  const dayInfo = dayTypes[currentDate];
  const dayBlocks = blocks
    .filter(b => b.date === currentDate && subjects[b.subject]?.visible !== false)
    .sort((a, b) => a.topic.localeCompare(b.topic));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Day Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            onClick={() => onDayClick(currentDate)}
            className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors"
            title="Configurar color y nota del día"
          >
            <span className="text-xs uppercase font-bold text-orange-600 dark:text-orange-400">
              {current.format('ddd')}
            </span>
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
              {current.date()}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 capitalize">
              {current.format('dddd, D [de] MMMM [de] YYYY')}
            </h2>
            {dayInfo ? (
              <div
                onClick={() => onDayClick(currentDate)}
                className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer"
                style={{
                  backgroundColor: dayInfo.color ? `${dayInfo.color}20` : undefined,
                  borderColor: dayInfo.color || undefined,
                  color: dayInfo.color || undefined,
                }}
              >
                <span>{dayInfo.note || dayInfo.type}</span>
              </div>
            ) : (
              <button
                onClick={() => onDayClick(currentDate)}
                className="mt-1 text-xs text-slate-400 hover:text-orange-600 transition-colors flex items-center gap-1"
              >
                <Plus size={12} /> Añadir nota o tipo de jornada
              </button>
            )}
          </div>
        </div>

        <Button onClick={() => onAddEventClick(currentDate)} variant="primary" size="sm">
          <Plus size={16} /> Crear Clase
        </Button>
      </div>

      {/* Classes for the day */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Clases y Actividades ({dayBlocks.length})
        </h3>

        {dayBlocks.map(block => {
          const subColor = block.color || subjects[block.subject]?.color || '#1abc9c';
          return (
            <div
              key={block.id}
              onClick={() => onEventClick(block)}
              onContextMenu={e => {
                if (onContextMenu) {
                  e.preventDefault();
                  onContextMenu(e, block);
                }
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-orange-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="w-3.5 h-12 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: subColor }}
                />

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold text-white uppercase tracking-wider"
                      style={{ backgroundColor: subColor }}
                    >
                      {block.subject}
                    </span>
                    {block.evaluation && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                        <Award size={13} /> Evaluación
                      </span>
                    )}
                    {(block.lessonPlanId || block.lessonPlan) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                        <BookOpen size={13} /> Plan de Lección
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                    {block.topic}
                  </h4>

                  {block.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                      "{block.notes}"
                    </p>
                  )}

                  {block.evaluation && block.evaluationDetails && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      <strong>Detalles:</strong> {block.evaluationDetails}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    onEventClick(block);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 size={14} /> Editar
                </Button>
              </div>
            </div>
          );
        })}

        {dayBlocks.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <Calendar size={36} className="text-slate-300 dark:text-slate-700" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No hay clases programadas para este día
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Pulsa el botón "Crear Clase" para planificar una sesión educativa para esta fecha.
            </p>
            <Button onClick={() => onAddEventClick(currentDate)} variant="primary" size="sm" className="mt-2">
              <Plus size={15} /> Añadir Primera Clase
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
