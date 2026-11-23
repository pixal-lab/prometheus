import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

export interface RecentLessonItem {
  id: string;
  title: string;
  date: string;
  path: string[];
}

interface RecentLessonsWidgetProps {
  recentLessons: RecentLessonItem[];
  onOpenLesson: (lesson: RecentLessonItem) => void;
}

export const RecentLessonsWidget: React.FC<RecentLessonsWidgetProps> = ({
  recentLessons,
  onOpenLesson,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-orange-600 dark:text-orange-400" />
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {t('hub_recent_plans_title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/lesson-planner')}
          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{t('hub_view_all_plans')}</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-3.5 space-y-2">
        {recentLessons.length > 0 ? (
          recentLessons.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => onOpenLesson(lesson)}
              className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800/60 hover:bg-orange-50/30 dark:hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="min-w-0 pr-2">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {lesson.title}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  {lesson.path.slice(0, -1).join(' / ') || t('hub_general_lesson')}
                </div>
              </div>
              <ChevronRight
                size={15}
                className="text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </div>
          ))
        ) : (
          <div className="py-5 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {t('hub_no_recent_lessons')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/lesson-planner')}
              className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>{t('hub_action_new_lesson')}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
