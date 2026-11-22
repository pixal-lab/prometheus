import React, { useState, useEffect } from 'react';
import { TimetableData, TimetableEvent, DayOfWeek, TimetableBlockType } from '../../../core/types/timetable.types';
import { Clock, GripVertical } from 'lucide-react';

interface TimetableGridProps {
  data: TimetableData;
  onBlockClick: (day: DayOfWeek, event: TimetableEvent) => void;
  onTimeSlotClick: (day: DayOfWeek, timeStr: string) => void;
  onContextMenu?: (e: React.MouseEvent, day: DayOfWeek, event: TimetableEvent) => void;
  onDropSubject?: (
    day: DayOfWeek,
    timeStr: string,
    subjectTitle: string,
    color: string,
    type: TimetableBlockType
  ) => void;
  onMoveBlock?: (
    fromDay: DayOfWeek,
    toDay: DayOfWeek,
    eventId: string,
    newStartTime: string,
    newEndTime: string
  ) => void;
  onResizeBlock?: (day: DayOfWeek, eventId: string, newEndTime: string) => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
];

const PIXELS_PER_HOUR = 70;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes: number): string {
  const bounded = Math.max(0, Math.min(1439, totalMinutes));
  const h = Math.floor(bounded / 60);
  const min = bounded % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function isColorDark(color?: string): boolean {
  if (!color || !color.startsWith('#')) return true;
  let hex = color.slice(1);
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.6;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  data,
  onBlockClick,
  onTimeSlotClick,
  onContextMenu,
  onDropSubject,
  onMoveBlock,
  onResizeBlock,
}) => {
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);

  // Dynamic boundaries for timetable hours
  const allStarts = Object.values(data).map(d => d.startMinutes ?? 480);
  const allEnds = Object.values(data).map(d => d.endMinutes ?? 1020);
  const minStartMin = Math.min(...allStarts);
  const maxEndMin = Math.max(...allEnds);
  const startHour = Math.max(6, Math.floor(minStartMin / 60));
  const endHour = Math.min(22, Math.ceil(maxEndMin / 60));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // Resizing state
  const [resizing, setResizing] = useState<{
    day: DayOfWeek;
    eventId: string;
    startMinutes: number;
    initialClientY: number;
    initialHeightPx: number;
    currentEndTime: string;
  } | null>(null);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizing.initialClientY;
      const newHeightPx = Math.max(20, resizing.initialHeightPx + deltaY);
      const addedMinutes = Math.round(newHeightPx / PIXELS_PER_MINUTE);
      // Snap to 15 min
      const snappedEndMinutes = Math.max(
        resizing.startMinutes + 15,
        Math.min(endHour * 60, resizing.startMinutes + Math.round(addedMinutes / 15) * 15)
      );
      setResizing(prev => (prev ? { ...prev, currentEndTime: minutesToTime(snappedEndMinutes) } : null));
    };

    const handleMouseUp = () => {
      if (resizing) {
        onResizeBlock?.(resizing.day, resizing.eventId, resizing.currentEndTime);
        setResizing(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, endHour, onResizeBlock]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-x-auto print:border-none print:shadow-none select-none">
      {/* Day header */}
      <div className="grid grid-cols-[60px_repeat(5,minmax(140px,1fr))] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-20">
        <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800">
          <Clock size={16} className="mx-auto" />
        </div>
        {DAYS.map(day => (
          <div
            key={day.key}
            className={`p-3 text-center text-sm font-bold border-r last:border-r-0 border-slate-200 dark:border-slate-800 transition-colors ${dragOverDay === day.key
                ? 'bg-orange-100/70 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400'
                : 'text-slate-800 dark:text-slate-100'
              }`}
          >
            {day.label}
          </div>
        ))}
      </div>

      {/* Grid Canvas */}
      <div
        className="grid grid-cols-[60px_repeat(5,minmax(140px,1fr))] relative"
        style={{ height: `${(endHour - startHour) * PIXELS_PER_HOUR}px` }}
      >
        {/* Hours Column */}
        <div className="border-r border-slate-200 dark:border-slate-800 relative bg-slate-50/50 dark:bg-slate-900/50">
          {hours.slice(0, -1).map((hour, idx) => (
            <div
              key={hour}
              className="absolute w-full text-right pr-2 text-xs font-mono text-slate-400 -translate-y-2"
              style={{ top: `${idx * PIXELS_PER_HOUR}px` }}
            >
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day Columns */}
        {DAYS.map(day => {
          const dayEvents = data[day.key]?.events || [];

          return (
            <div
              key={day.key}
              className={`relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 transition-colors ${dragOverDay === day.key ? 'bg-orange-50/60 dark:bg-orange-950/20' : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
                }`}
              onDoubleClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const minutes = Math.floor(clickY / PIXELS_PER_MINUTE) + startHour * 60;
                const roundedM = Math.floor(minutes / 15) * 15;
                const h = Math.floor(roundedM / 60);
                const m = roundedM % 60;
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                onTimeSlotClick(day.key, timeStr);
              }}
              onDragOver={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverDay !== day.key) setDragOverDay(day.key);
              }}
              onDragLeave={e => {
                // If leaving the day column, clear highlight
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverDay(null);
                }
              }}
              onDrop={e => {
                e.preventDefault();
                setDragOverDay(null);
                const rawData = e.dataTransfer.getData('application/json');
                if (!rawData) return;
                try {
                  const parsed = JSON.parse(rawData);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const minutes = Math.floor(clickY / PIXELS_PER_MINUTE) + startHour * 60;
                  const roundedM = Math.floor(minutes / 15) * 15;

                  if (parsed.isExistingBlock) {
                    // Moving an existing block
                    const duration = parsed.durationMinutes || 60;
                    const newStartM = roundedM;
                    const newEndM = roundedM + duration;
                    const newStartTime = minutesToTime(newStartM);
                    const newEndTime = minutesToTime(newEndM);
                    onMoveBlock?.(parsed.fromDay, day.key, parsed.eventId, newStartTime, newEndTime);
                  } else {
                    // Dropping a subject or block from the palette
                    const h = Math.floor(roundedM / 60);
                    const m = roundedM % 60;
                    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    onDropSubject?.(day.key, timeStr, parsed.title, parsed.color, parsed.type || 'course');
                  }
                } catch (err) {
                  // ignore invalid drop payload
                }
              }}
            >
              {/* Hour Guide lines */}
              {hours.slice(0, -1).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-full border-b border-slate-100 dark:border-slate-800/60 pointer-events-none"
                  style={{ top: `${idx * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
                />
              ))}

              {/* Event Blocks */}
              {dayEvents.map(event => {
                const isCurrentResizing = resizing && resizing.eventId === event.id;
                const startM = timeToMinutes(event.startTime);
                const endM = isCurrentResizing ? timeToMinutes(resizing.currentEndTime) : timeToMinutes(event.endTime);
                const baseM = startHour * 60;

                const topPx = Math.max(0, (startM - baseM) * PIXELS_PER_MINUTE);
                const heightPx = Math.max(26, (endM - startM) * PIXELS_PER_MINUTE);
                const isDark = isColorDark(event.color);

                return (
                  <div
                    key={event.id}
                    draggable={!resizing}
                    onDragStart={e => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({
                          isExistingBlock: true,
                          eventId: event.id,
                          fromDay: day.key,
                          durationMinutes: endM - startM,
                          title: event.title,
                          color: event.color,
                          type: event.type,
                        })
                      );
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => onBlockClick(day.key, event)}
                    onContextMenu={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onContextMenu?.(e, day.key, event);
                    }}
                    className={`absolute left-1.5 right-1.5 rounded-xl p-2 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] transition-all overflow-hidden flex flex-col justify-between group z-10 ${isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      backgroundColor: event.color || '#3b82f6',
                    }}
                    title={`${event.title} (${event.startTime} - ${isCurrentResizing ? resizing.currentEndTime : event.endTime}) - Arrastra para reubicar`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs leading-tight truncate drop-shadow-xs">
                          {event.title}
                        </span>
                        {heightPx > 36 && (
                          <span className="text-[10px] opacity-90 font-mono mt-0.5 font-medium">
                            {event.startTime} - {isCurrentResizing ? resizing.currentEndTime : event.endTime}
                          </span>
                        )}
                      </div>
                      <GripVertical size={13} className="opacity-0 group-hover:opacity-75 shrink-0 transition-opacity" />
                    </div>

                    {heightPx > 60 && event.notes && (
                      <span className="text-[10px] opacity-80 truncate italic mt-auto">
                        {event.notes}
                      </span>
                    )}

                    {/* Resize handle bar at bottom edge */}
                    <div
                      onMouseDown={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizing({
                          day: day.key,
                          eventId: event.id,
                          startMinutes: startM,
                          initialClientY: e.clientY,
                          initialHeightPx: heightPx,
                          currentEndTime: event.endTime,
                        });
                      }}
                      className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Arrastra para cambiar duración"
                    >
                      <div className="w-6 h-1 rounded-full bg-white/60" />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
