import React, { useEffect, useRef } from 'react';
import { ClassBlock } from '../../../core/types/calendar.types';
import { Edit3, ArrowRight, FastForward, MoveHorizontal, Trash2, BookOpen } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface ContextMenuProps {
  x: number;
  y: number;
  event: ClassBlock;
  onClose: () => void;
  onEdit: (event: ClassBlock) => void;
  onReschedule: (event: ClassBlock, cascade: boolean) => void;
  onMoveSubject: (subject: string) => void;
  onDelete: (event: ClassBlock) => void;
  onViewLessonPlan?: (event: ClassBlock) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  event,
  onClose,
  onEdit,
  onReschedule,
  onMoveSubject,
  onDelete,
  onViewLessonPlan,
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

  // Adjust menu position if it overflows window bounds
  const adjustedX = Math.min(x, window.innerWidth - 240);
  const adjustedY = Math.min(y, window.innerHeight - 260);

  return (
    <div
      ref={menuRef}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 text-xs text-slate-700 dark:text-slate-200 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 select-none"
    >
      <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 text-[10px] uppercase tracking-wider truncate mb-0.5">
        {event.subject}: {event.topic}
      </div>

      <button
        onClick={() => {
          onClose();
          onEdit(event);
        }}
        className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <Edit3 size={14} className="text-blue-500" />
        <span>{t('context_edit_class')}</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onReschedule(event, false);
        }}
        className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <ArrowRight size={14} className="text-orange-500" />
        <span>{t('context_reschedule_next')}</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onReschedule(event, true);
        }}
        className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <FastForward size={14} className="text-amber-500" />
        <span>{t('context_reschedule_cascade')}</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onMoveSubject(event.subject);
        }}
        className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        <MoveHorizontal size={14} className="text-emerald-500" />
        <span>{t('context_move_course')}</span>
      </button>

      {(event.lessonPlanId || event.lessonPlan) && onViewLessonPlan && (
        <button
          onClick={() => {
            onClose();
            onViewLessonPlan(event);
          }}
          className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <BookOpen size={14} className="text-indigo-500" />
          <span>{t('context_view_plan')}</span>
        </button>
      )}

      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

      <button
        onClick={() => {
          onClose();
          onDelete(event);
        }}
        className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2.5 font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
      >
        <Trash2 size={14} />
        <span>{t('context_delete')}</span>
      </button>
    </div>
  );
};
