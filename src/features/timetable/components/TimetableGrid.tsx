import React, { useState, useEffect, useRef } from 'react';
import { TimetableData, TimetableEvent, DayOfWeek, TimetableBlockType } from '../../../core/types/timetable.types';
import { Clock, GripVertical } from 'lucide-react';
import { useTimetableStore } from '../store/useTimetableStore';
import { useTranslation } from '../../../core/i18n/useTranslation';

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

interface DraggingBlockState {
  eventId: string;
  fromDay: DayOfWeek;
  currentDay: DayOfWeek;
  durationMinutes: number;
  initialStartMinutes: number;
  currentStartMinutes: number;
  title: string;
  color: string;
  type: TimetableBlockType;
  notes?: string;
  initialClientX: number;
  initialClientY: number;
  grabOffsetY: number;
  hasMoved: boolean;
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
  const { t } = useTranslation();
  const { draggedPaletteItem } = useTimetableStore();
  const [dragOverDay, setDragOverDay] = useState<DayOfWeek | null>(null);

  // Palette drop preview (for HTML5 DnD from left sidebar)
  const [paletteDropPreview, setPaletteDropPreview] = useState<{
    day: DayOfWeek;
    startMinutes: number;
  } | null>(null);

  // Dragging existing timetable block (Pointer / Mouse based)
  const [dragging, setDragging] = useState<DraggingBlockState | null>(null);
  const justDraggedRef = useRef(false);

  // References to track column bounding rects accurately
  const gridRef = useRef<HTMLDivElement>(null);
  const dayColumnRefs = useRef<Record<DayOfWeek, HTMLDivElement | null>>({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
  });

  // Dynamic boundaries for timetable hours:
  // Must factor in configured day bounds, existing events, and active drag/palette previews
  const allStarts = Object.values(data).flatMap(d => [
    d.startMinutes ?? 480,
    ...d.events.map((e: TimetableEvent) => timeToMinutes(e.startTime)),
  ]);
  if (dragging && dragging.hasMoved) {
    allStarts.push(dragging.currentStartMinutes);
  }
  if (paletteDropPreview) {
    allStarts.push(paletteDropPreview.startMinutes);
  }

  const allEnds = Object.values(data).flatMap(d => [
    d.endMinutes ?? 1020,
    ...d.events.map((e: TimetableEvent) => timeToMinutes(e.endTime)),
  ]);
  if (dragging && dragging.hasMoved) {
    allEnds.push(dragging.currentStartMinutes + dragging.durationMinutes);
  }
  if (paletteDropPreview) {
    allEnds.push(paletteDropPreview.startMinutes + (draggedPaletteItem?.durationMinutes || 60));
  }

  const minStartMin = Math.min(...allStarts);
  const maxEndMin = Math.max(...allEnds);
  const startHour = Math.max(0, Math.min(8, Math.floor(minStartMin / 60)));
  const endHour = Math.min(24, Math.max(18, Math.ceil(maxEndMin / 60)));
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
      // Snap to 15 min, up to 24:00 (1440 min)
      const snappedEndMinutes = Math.max(
        resizing.startMinutes + 15,
        Math.min(1440, resizing.startMinutes + Math.round(addedMinutes / 15) * 15)
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

  // Pointer drag event listeners for moving existing blocks with real-time slot snapping
  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - dragging.initialClientX;
      const dy = e.clientY - dragging.initialClientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const hasMoved = dragging.hasMoved || dist > 4;
      if (!hasMoved) return;

      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      // Auto-scroll window if near edges
      if (e.clientY < 60) {
        window.scrollBy(0, -8);
      } else if (e.clientY > window.innerHeight - 60) {
        window.scrollBy(0, 8);
      }

      // Determine the target day column by measuring each day's bounding rect
      let targetDay: DayOfWeek = dragging.currentDay;
      let minDistance = Infinity;

      for (const d of DAYS) {
        const colEl = dayColumnRefs.current[d.key];
        if (colEl) {
          const r = colEl.getBoundingClientRect();
          if (e.clientX >= r.left && e.clientX <= r.right) {
            targetDay = d.key;
            minDistance = 0;
            break;
          }
          const colCenter = (r.left + r.right) / 2;
          const distToCol = Math.abs(e.clientX - colCenter);
          if (distToCol < minDistance) {
            minDistance = distToCol;
            targetDay = d.key;
          }
        }
      }

      // Calculate vertical slot
      const targetColEl = dayColumnRefs.current[targetDay] || gridRef.current;
      if (!targetColEl) return;
      const colRect = targetColEl.getBoundingClientRect();

      const cursorYInCol = e.clientY - colRect.top;
      const blockTopY = cursorYInCol - dragging.grabOffsetY;
      const minutesFromStartHour = blockTopY / PIXELS_PER_MINUTE;
      const snappedMinutes = Math.round(minutesFromStartHour / 15) * 15;
      const rawStartMinutes = startHour * 60 + snappedMinutes;

      const targetStartMinutes = Math.max(
        0,
        Math.min(1440 - dragging.durationMinutes, rawStartMinutes)
      );

      setDragging(prev => {
        if (!prev) return null;
        if (
          prev.hasMoved === true &&
          prev.currentDay === targetDay &&
          prev.currentStartMinutes === targetStartMinutes
        ) {
          return prev;
        }
        return {
          ...prev,
          hasMoved: true,
          currentDay: targetDay,
          currentStartMinutes: targetStartMinutes,
        };
      });
    };

    const handlePointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      if (dragging.hasMoved) {
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 120);

        if (
          dragging.fromDay !== dragging.currentDay ||
          dragging.currentStartMinutes !== dragging.initialStartMinutes
        ) {
          const newStartTime = minutesToTime(dragging.currentStartMinutes);
          const newEndTime = minutesToTime(dragging.currentStartMinutes + dragging.durationMinutes);
          onMoveBlock?.(
            dragging.fromDay,
            dragging.currentDay,
            dragging.eventId,
            newStartTime,
            newEndTime
          );
        }
      } else {
        const ev = data[dragging.fromDay]?.events.find(e => e.id === dragging.eventId);
        if (ev) {
          onBlockClick(dragging.fromDay, ev);
        }
      }

      setDragging(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setDragging(null);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragging, startHour, endHour, onMoveBlock, onBlockClick, data]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-x-auto print:border-none print:shadow-none select-none">
      {/* Day header */}
      <div className="grid grid-cols-[60px_repeat(5,minmax(140px,1fr))] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-20">
        <div className="p-3 text-center text-xs font-semibold text-slate-400 border-r border-slate-200 dark:border-slate-800">
          <Clock size={16} className="mx-auto" />
        </div>
        {DAYS.map(day => {
          const isHighlighted =
            (dragging?.hasMoved && dragging.currentDay === day.key) ||
            dragOverDay === day.key ||
            paletteDropPreview?.day === day.key;

          return (
            <div
              key={day.key}
              className={`p-3 text-center text-sm font-bold border-r last:border-r-0 border-slate-200 dark:border-slate-800 transition-colors ${
                isHighlighted
                  ? 'bg-orange-100/70 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-extrabold'
                  : 'text-slate-800 dark:text-slate-100'
              }`}
            >
              {t(day.key)}
            </div>
          );
        })}
      </div>

      {/* Grid Canvas */}
      <div
        ref={gridRef}
        className="grid grid-cols-[60px_repeat(5,minmax(140px,1fr))] relative"
        style={{ height: `${(endHour - startHour) * PIXELS_PER_HOUR}px` }}
      >
        {/* Hours Column */}
        <div className="border-r border-slate-200 dark:border-slate-800 relative bg-slate-50/50 dark:bg-slate-900/50 pointer-events-none">
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
          const dayStart = data[day.key]?.startMinutes ?? 480;
          const dayEnd = data[day.key]?.endMinutes ?? 1020;
          const isColumnActive =
            (dragging?.hasMoved && dragging.currentDay === day.key) ||
            dragOverDay === day.key ||
            paletteDropPreview?.day === day.key;

          return (
            <div
              key={day.key}
              ref={el => {
                dayColumnRefs.current[day.key] = el;
              }}
              className={`relative border-r last:border-r-0 border-slate-200 dark:border-slate-800 transition-colors ${
                isColumnActive
                  ? 'bg-orange-50/60 dark:bg-orange-950/20'
                  : 'hover:bg-slate-50/40 dark:hover:bg-slate-800/20'
              }`}
              onDoubleClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const minutes = Math.floor(clickY / PIXELS_PER_MINUTE) + startHour * 60;
                const roundedM = Math.max(0, Math.min(1440 - 90, Math.floor(minutes / 15) * 15));
                const h = Math.floor(roundedM / 60);
                const m = roundedM % 60;
                const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                onTimeSlotClick(day.key, timeStr);
              }}
              onDragOver={e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverDay !== day.key) setDragOverDay(day.key);

                const rect = e.currentTarget.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const duration = draggedPaletteItem?.durationMinutes || 60;
                const minutes = Math.floor(clickY / PIXELS_PER_MINUTE) + startHour * 60;
                const roundedM = Math.floor(minutes / 15) * 15;
                const snappedStartMinutes = Math.max(
                  0,
                  Math.min(1440 - duration, roundedM)
                );

                setPaletteDropPreview(prev => {
                  if (prev && prev.day === day.key && prev.startMinutes === snappedStartMinutes) {
                    return prev;
                  }
                  return { day: day.key, startMinutes: snappedStartMinutes };
                });
              }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  if (dragOverDay === day.key) setDragOverDay(null);
                  setPaletteDropPreview(null);
                }
              }}
              onDrop={e => {
                e.preventDefault();
                setDragOverDay(null);
                setPaletteDropPreview(null);
                const rawData = e.dataTransfer.getData('application/json');
                if (!rawData) return;
                try {
                  const parsed = JSON.parse(rawData);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const duration =
                    parsed.durationMinutes ||
                    draggedPaletteItem?.durationMinutes ||
                    (parsed.type === 'break' ? 30 : parsed.type === 'lunch' ? 60 : 90);
                  const minutes = Math.floor(clickY / PIXELS_PER_MINUTE) + startHour * 60;
                  const roundedM = Math.floor(minutes / 15) * 15;
                  const snappedStartMinutes = Math.max(
                    0,
                    Math.min(1440 - duration, roundedM)
                  );

                  if (parsed.isExistingBlock) {
                    const newStartTime = minutesToTime(snappedStartMinutes);
                    const newEndTime = minutesToTime(snappedStartMinutes + duration);
                    onMoveBlock?.(parsed.fromDay, day.key, parsed.eventId, newStartTime, newEndTime);
                  } else {
                    const timeStr = minutesToTime(snappedStartMinutes);
                    onDropSubject?.(day.key, timeStr, parsed.title, parsed.color, parsed.type || 'course');
                  }
                } catch (err) {
                  // ignore invalid drop payload
                }
              }}
            >
              {/* Shaded zone for hours past regular day schedule */}
              {dayEnd < endHour * 60 && (
                <div
                  className="absolute left-0 right-0 pointer-events-none bg-amber-500/[0.03] dark:bg-amber-400/[0.02] border-t-2 border-dashed border-amber-500/40 dark:border-amber-400/30 z-5"
                  style={{
                    top: `${(dayEnd - startHour * 60) * PIXELS_PER_MINUTE}px`,
                    bottom: 0,
                  }}
                >
                  <span className="absolute right-1 -top-2.5 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-2xs select-none">
                    Fin jornada {minutesToTime(dayEnd)}
                  </span>
                </div>
              )}

              {/* Shaded zone for hours before regular day schedule */}
              {dayStart > startHour * 60 && (
                <div
                  className="absolute left-0 right-0 pointer-events-none bg-amber-500/[0.03] dark:bg-amber-400/[0.02] border-b-2 border-dashed border-amber-500/40 dark:border-amber-400/30 z-5"
                  style={{
                    top: 0,
                    height: `${(dayStart - startHour * 60) * PIXELS_PER_MINUTE}px`,
                  }}
                >
                  <span className="absolute right-1 -bottom-2.5 px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 shadow-2xs select-none">
                    Inicio jornada {minutesToTime(dayStart)}
                  </span>
                </div>
              )}
              {/* Hour Guide lines */}
              {hours.slice(0, -1).map((_, idx) => (
                <div
                  key={idx}
                  className="absolute w-full border-b border-slate-100 dark:border-slate-800/60 pointer-events-none"
                  style={{ top: `${idx * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
                />
              ))}

              {/* Existing Event Blocks */}
              {dayEvents.map(event => {
                const isCurrentlyMoved = dragging && dragging.eventId === event.id && dragging.hasMoved;
                const isCurrentResizing = resizing && resizing.eventId === event.id;
                const startM = timeToMinutes(event.startTime);
                const endM = isCurrentResizing ? timeToMinutes(resizing.currentEndTime) : timeToMinutes(event.endTime);
                const baseM = startHour * 60;

                const topPx = Math.max(0, (startM - baseM) * PIXELS_PER_MINUTE);
                const heightPx = Math.max(26, (endM - startM) * PIXELS_PER_MINUTE);
                const isDark = isColorDark(event.color);
                const isPastSchedule = endM > dayEnd;

                // Placeholder left at original spot while moving
                if (isCurrentlyMoved) {
                  return (
                    <div
                      key={event.id}
                      className="absolute left-1.5 right-1.5 rounded-xl p-2 border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/40 dark:bg-slate-800/30 opacity-40 select-none pointer-events-none flex flex-col justify-between"
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs truncate text-slate-500 dark:text-slate-400">
                          {event.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 italic">Moviendo...</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={event.id}
                    onPointerDown={e => {
                      if (e.button !== 0) return;
                      if (resizing) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const grabOffsetY = e.clientY - rect.top;
                      const dur = endM - startM;
                      setDragging({
                        eventId: event.id,
                        fromDay: day.key,
                        currentDay: day.key,
                        durationMinutes: dur,
                        initialStartMinutes: startM,
                        currentStartMinutes: startM,
                        title: event.title,
                        color: event.color,
                        type: event.type,
                        notes: event.notes,
                        initialClientX: e.clientX,
                        initialClientY: e.clientY,
                        grabOffsetY,
                        hasMoved: false,
                      });
                    }}
                    onClick={() => {
                      if (justDraggedRef.current) return;
                      onBlockClick(day.key, event);
                    }}
                    onContextMenu={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      onContextMenu?.(e, day.key, event);
                    }}
                    className={`absolute left-1.5 right-1.5 rounded-xl p-2 shadow-xs cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.01] transition-transform overflow-hidden flex flex-col justify-between group z-10 touch-none select-none ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      backgroundColor: event.color || '#3b82f6',
                    }}
                    title={`${event.title} (${event.startTime} - ${isCurrentResizing ? resizing.currentEndTime : event.endTime}) - Haz clic y arrastra para reubicar`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs leading-tight truncate drop-shadow-xs">
                            {event.title}
                          </span>
                          {isPastSchedule && (
                            <span
                              className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/30 text-amber-100 border border-amber-400/60 px-1 py-0.2 rounded shrink-0 shadow-2xs"
                              title={`Bloque fuera de la jornada habitual (${event.endTime} > ${minutesToTime(dayEnd)})`}
                            >
                              Extensión
                            </span>
                          )}
                        </div>
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
                      data-resize-handle
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
                      onPointerDown={e => {
                        e.stopPropagation();
                      }}
                      className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Arrastra para cambiar duración"
                    >
                      <div className="w-6 h-1 rounded-full bg-white/60" />
                    </div>
                  </div>
                );
              })}

              {/* Real-time snapped preview of block being dragged */}
              {dragging && dragging.hasMoved && dragging.currentDay === day.key && (() => {
                const previewTopPx = Math.max(0, (dragging.currentStartMinutes - startHour * 60) * PIXELS_PER_MINUTE);
                const previewHeightPx = Math.max(26, dragging.durationMinutes * PIXELS_PER_MINUTE);
                const previewStartTime = minutesToTime(dragging.currentStartMinutes);
                const previewEndTime = minutesToTime(dragging.currentStartMinutes + dragging.durationMinutes);
                const isDark = isColorDark(dragging.color);

                // Conflict check
                const hasConflict = dayEvents.some(
                  e =>
                    e.id !== dragging.eventId &&
                    Math.max(dragging.currentStartMinutes, timeToMinutes(e.startTime)) <
                      Math.min(dragging.currentStartMinutes + dragging.durationMinutes, timeToMinutes(e.endTime))
                );

                return (
                  <div
                    className={`absolute left-1 right-1 rounded-xl p-2.5 shadow-2xl z-30 pointer-events-none select-none flex flex-col justify-between overflow-hidden transition-all duration-75 ease-out ring-2 ${
                      hasConflict
                        ? 'ring-amber-500 bg-amber-600/90'
                        : 'ring-orange-500'
                    } ${isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{
                      top: `${previewTopPx}px`,
                      height: `${previewHeightPx}px`,
                      backgroundColor: hasConflict ? undefined : (dragging.color || '#3b82f6'),
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-xs leading-tight truncate drop-shadow-xs">
                          {dragging.title}
                        </span>
                        <span className="text-[10px] opacity-95 font-mono font-bold mt-0.5 bg-black/25 dark:bg-black/45 px-1.5 py-0.5 rounded w-fit">
                          {previewStartTime} - {previewEndTime}
                        </span>
                      </div>
                      {hasConflict ? (
                        <span className="text-[9px] font-bold bg-amber-700 text-amber-100 px-1.5 py-0.5 rounded-full shadow-xs shrink-0 animate-pulse">
                          Superposición
                        </span>
                      ) : (dragging.currentStartMinutes + dragging.durationMinutes) > dayEnd ? (
                        <span className="text-[9px] font-bold bg-amber-600 text-amber-100 px-1.5 py-0.5 rounded-full shadow-xs shrink-0">
                          Extensión jornada
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full shadow-xs shrink-0 animate-pulse">
                          Soltar aquí
                        </span>
                      )}
                    </div>

                    {previewHeightPx > 60 && dragging.notes && (
                      <span className="text-[10px] opacity-80 truncate italic mt-auto">
                        {dragging.notes}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Real-time snapped preview of palette item being dragged over */}
              {paletteDropPreview && paletteDropPreview.day === day.key && (() => {
                const dur = draggedPaletteItem?.durationMinutes || 60;
                const previewTopPx = Math.max(0, (paletteDropPreview.startMinutes - startHour * 60) * PIXELS_PER_MINUTE);
                const previewHeightPx = Math.max(26, dur * PIXELS_PER_MINUTE);
                const previewStartTime = minutesToTime(paletteDropPreview.startMinutes);
                const previewEndTime = minutesToTime(paletteDropPreview.startMinutes + dur);
                const color = draggedPaletteItem?.color || '#3b82f6';
                const isDark = isColorDark(color);

                const hasConflict = dayEvents.some(
                  e =>
                    Math.max(paletteDropPreview.startMinutes, timeToMinutes(e.startTime)) <
                    Math.min(paletteDropPreview.startMinutes + dur, timeToMinutes(e.endTime))
                );

                return (
                  <div
                    className={`absolute left-1 right-1 rounded-xl p-2.5 shadow-2xl z-30 pointer-events-none select-none flex flex-col justify-between overflow-hidden transition-all duration-75 ease-out border-2 border-dashed ${
                      hasConflict
                        ? 'border-amber-400 ring-2 ring-amber-500'
                        : 'border-white ring-2 ring-orange-500'
                    } ${isDark ? 'text-white' : 'text-slate-900'}`}
                    style={{
                      top: `${previewTopPx}px`,
                      height: `${previewHeightPx}px`,
                      backgroundColor: color,
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-xs leading-tight truncate drop-shadow-xs">
                          {draggedPaletteItem?.title || 'Nuevo Bloque'}
                        </span>
                        <span className="text-[10px] opacity-95 font-mono font-bold mt-0.5 bg-black/25 dark:bg-black/45 px-1.5 py-0.5 rounded w-fit">
                          {previewStartTime} - {previewEndTime}
                        </span>
                      </div>
                      {hasConflict ? (
                        <span className="text-[9px] font-bold bg-amber-600 text-white px-1.5 py-0.5 rounded-full shadow-xs shrink-0 animate-pulse">
                          Superposición
                        </span>
                      ) : (paletteDropPreview.startMinutes + dur) > dayEnd ? (
                        <span className="text-[9px] font-bold bg-amber-600 text-amber-100 px-1.5 py-0.5 rounded-full shadow-xs shrink-0">
                          Extensión jornada
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full shadow-xs shrink-0 animate-pulse">
                          Añadir aquí
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};
