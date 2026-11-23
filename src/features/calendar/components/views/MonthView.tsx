import React, { useState } from 'react';
import dayjs from 'dayjs';
import { ClassBlock, SubjectConfig, DayTypeInfo } from '../../../../core/types/calendar.types';
import { Plus, Award, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../../core/i18n/useTranslation';

interface MonthViewProps {
  currentDate: string; // YYYY-MM-DD
  blocks: ClassBlock[];
  subjects: Record<string, SubjectConfig>;
  dayTypes: Record<string, DayTypeInfo>;
  onEventClick: (event: ClassBlock) => void;
  onAddEventClick: (date: string) => void;
  onDayClick: (date: string) => void;
  onContextMenu?: (e: React.MouseEvent, block: ClassBlock) => void;
  onDropBlock?: (blockId: string, targetDate: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  blocks,
  subjects,
  dayTypes,
  onEventClick,
  onAddEventClick,
  onDayClick,
  onContextMenu,
  onDropBlock,
}) => {
  const { t } = useTranslation();
  const weekdays = [
    t('monday'),
    t('tuesday'),
    t('wednesday'),
    t('thursday'),
    t('friday'),
    t('saturday'),
    t('sunday'),
  ];
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const current = dayjs(currentDate);
  const startOfMonth = current.startOf('month');
  const endOfMonth = current.endOf('month');

  // Find start day of the calendar grid (Monday-based)
  // dayjs .day(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const startDayOfWeek = (startOfMonth.day() + 6) % 7; // 0 for Monday, 6 for Sunday
  const daysInMonth = endOfMonth.date();

  const totalGridCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
  const gridDays = Array.from({ length: totalGridCells }, (_, i) => {
    const dayOffset = i - startDayOfWeek + 1;
    return startOfMonth.date(dayOffset);
  });

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
        {weekdays.map((wd, i) => (
          <div
            key={wd}
            className={`py-2.5 text-center text-xs font-bold ${i >= 5 ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'
              }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
        {gridDays.map(dayObj => {
          const dateStr = dayObj.format('YYYY-MM-DD');
          const isCurrentMonth = dayObj.month() === current.month();
          const isToday = dayObj.isSame(dayjs(), 'day');

          const dayInfo = dayTypes[dateStr];
          const dayBlocks = blocks.filter(b => b.date === dateStr && subjects[b.subject]?.visible !== false);

          const dayTypeStyles: Record<string, string> = {
            school_event: 'bg-red-500/10 border-red-500/40 text-red-700 dark:text-red-300',
            holiday: 'bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300',
            in_service: 'bg-slate-500/10 border-slate-500/40 text-slate-700 dark:text-slate-300',
            early_release: 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300',
          };

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              onDragOver={e => {
                e.preventDefault();
                if (dragOverDate !== dateStr) setDragOverDate(dateStr);
              }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverDate(null);
                }
              }}
              onDrop={e => {
                e.preventDefault();
                setDragOverDate(null);
                const bId = e.dataTransfer.getData('text/plain');
                if (bId) onDropBlock?.(bId, dateStr);
              }}
              className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer group relative ${dragOverDate === dateStr
                  ? 'bg-orange-100/70 dark:bg-orange-950/40 ring-2 ring-inset ring-orange-500 z-10'
                  : isCurrentMonth
                    ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 opacity-40 hover:opacity-80'
                }`}
            >
              {/* Day Header with number and note */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold font-mono ${isToday
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-700 dark:text-slate-300'
                    }`}
                >
                  {dayObj.date()}
                </span>

                {/* Day Special Type Badge */}
                {dayInfo && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded border truncate max-w-[80px]"
                    style={{
                      backgroundColor: dayInfo.color ? `${dayInfo.color}20` : undefined,
                      borderColor: dayInfo.color || undefined,
                      color: dayInfo.color || undefined,
                    }}
                    title={dayInfo.note || dayInfo.type}
                  >
                    {dayInfo.note || dayInfo.type}
                  </span>
                )}

                {/* Quick Add Button */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onAddEventClick(dateStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-orange-100 dark:hover:bg-orange-950 text-orange-600 dark:text-orange-400 transition-opacity"
                  title="Añadir clase a este día"
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Day Class Blocks */}
              <div className="flex flex-col gap-1 my-1 max-h-24 overflow-y-auto overflow-x-hidden">
                {dayBlocks.map(block => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', block.id);
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      onEventClick(block);
                    }}
                    onContextMenu={e => {
                      if (onContextMenu) {
                        e.preventDefault();
                        e.stopPropagation();
                        onContextMenu(e, block);
                      }
                    }}
                    className="flex items-center justify-between px-2 py-1 rounded text-xs font-semibold text-white shadow-2xs hover:brightness-110 hover:shadow-xs active:opacity-60 transition-all truncate cursor-grab active:cursor-grabbing"
                    style={{ backgroundColor: block.color || subjects[block.subject]?.color || '#1abc9c' }}
                    title={`${block.subject}: ${block.topic} (Clic derecho para opciones)`}
                  >
                    <span className="truncate">{block.topic}</span>
                    {block.evaluation && (
                      <Award size={12} className="shrink-0 text-amber-200 ml-1" />
                    )}
                  </div>
                ))}
              </div>

              {dayBlocks.length > 3 && (
                <span className="text-[10px] text-slate-400 font-medium">
                  +{dayBlocks.length - 3} más
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

