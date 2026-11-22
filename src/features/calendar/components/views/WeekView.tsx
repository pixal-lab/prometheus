import React, { useState } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { ClassBlock, SubjectConfig, DayTypeInfo } from '../../../../core/types/calendar.types';
import { Plus, Award } from 'lucide-react';

dayjs.extend(isoWeek);

interface WeekViewProps {
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

export const WeekView: React.FC<WeekViewProps> = ({
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
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const current = dayjs(currentDate);
  // Find Monday of the current week (ISO week starts on Monday)
  const monday = current.startOf('isoWeek');
  const weekDays = Array.from({ length: 5 }, (_, i) => monday.add(i, 'day')); // Mon to Fri

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {weekDays.map(dayObj => {
        const dateStr = dayObj.format('YYYY-MM-DD');
        const isToday = dayObj.isSame(dayjs(), 'day');
        const dayInfo = dayTypes[dateStr];
        const dayBlocks = blocks.filter(b => b.date === dateStr && subjects[b.subject]?.visible !== false);

        return (
          <div
            key={dateStr}
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
            className={`flex flex-col bg-white dark:bg-slate-900 border rounded-2xl p-3.5 shadow-xs min-h-[450px] transition-all ${dragOverDate === dateStr
                ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 ring-2 ring-orange-500'
                : 'border-slate-200 dark:border-slate-800'
              }`}
          >
            {/* Header */}
            <div
              onClick={() => onDayClick(dateStr)}
              className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {dayObj.format('dddd')}
                </span>
                <span className={`text-lg font-bold font-mono ${isToday ? 'text-orange-600' : 'text-slate-800 dark:text-slate-100'}`}>
                  {dayObj.format('DD MMM')}
                </span>
              </div>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onAddEventClick(dateStr);
                }}
                className="p-1 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-950 text-orange-600 dark:text-orange-400"
              >
                <Plus size={16} />
              </button>
            </div>

            {dayInfo && (
              <div
                onClick={() => onDayClick(dateStr)}
                className="my-2 p-1.5 rounded-lg text-xs font-semibold border cursor-pointer truncate"
                style={{
                  backgroundColor: dayInfo.color ? `${dayInfo.color}20` : undefined,
                  borderColor: dayInfo.color || undefined,
                  color: dayInfo.color || undefined,
                }}
              >
                {dayInfo.note || dayInfo.type}
              </div>
            )}

            {/* Blocks List */}
            <div className="flex-1 flex flex-col gap-2 mt-3 overflow-y-auto">
              {dayBlocks.map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', block.id);
                  }}
                  onClick={() => onEventClick(block)}
                  onContextMenu={e => {
                    if (onContextMenu) {
                      e.preventDefault();
                      e.stopPropagation();
                      onContextMenu(e, block);
                    }
                  }}
                  className="p-3 rounded-xl text-white shadow-xs cursor-grab active:cursor-grabbing hover:scale-[1.02] active:opacity-60 transition-transform flex flex-col gap-1"
                  style={{ backgroundColor: block.color || subjects[block.subject]?.color || '#1abc9c' }}
                  title={`${block.subject}: ${block.topic} (Clic derecho para opciones)`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-85">
                      {block.subject}
                    </span>
                    {block.evaluation && <Award size={14} className="text-amber-200" />}
                  </div>
                  <span className="text-sm font-bold leading-tight drop-shadow-xs">
                    {block.topic}
                  </span>
                  {block.notes && (
                    <span className="text-[11px] opacity-80 italic truncate">{block.notes}</span>
                  )}
                </div>
              ))}

              {dayBlocks.length === 0 && (
                <span className="text-xs text-slate-400 italic text-center py-8">
                  Sin clases programadas
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

