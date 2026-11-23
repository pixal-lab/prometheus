import React, { useEffect, useRef } from 'react';
import { TimetableEvent, DayOfWeek } from '../../../core/types/timetable.types';
import { Edit3, Copy, Trash2, Clock } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface TimetableContextMenuProps {
  x: number;
  y: number;
  day: DayOfWeek;
  event: TimetableEvent;
  onClose: () => void;
  onEdit: (day: DayOfWeek, event: TimetableEvent) => void;
  onDuplicate: (day: DayOfWeek, event: TimetableEvent) => void;
  onDelete: (day: DayOfWeek, event: TimetableEvent) => void;
}

export const TimetableContextMenu: React.FC<TimetableContextMenuProps> = ({
  x,
  y,
  day,
  event,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 200);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
          {event.title}
        </span>
        <span className="font-mono text-[10px] text-slate-400">
          {event.startTime}-{event.endTime}
        </span>
      </div>

      <button
        onClick={() => {
          onEdit(day, event);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left"
      >
        <Edit3 size={14} className="text-blue-500" />
        <span>{t('edit_block')}</span>
      </button>

      <button
        onClick={() => {
          onDuplicate(day, event);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors text-left"
      >
        <Copy size={14} className="text-purple-500" />
        <span>{t('duplicate_block')}</span>
      </button>

      <div className="h-px bg-slate-100 dark:bg-slate-800 my-0.5" />

      <button
        onClick={() => {
          onDelete(day, event);
          onClose();
        }}
        className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors text-left"
      >
        <Trash2 size={14} />
        <span>{t('delete_block')}</span>
      </button>
    </div>
  );
};
