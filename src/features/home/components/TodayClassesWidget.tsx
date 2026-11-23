import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, Coffee, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { TimetableEvent } from '../../../core/types/timetable.types';

export interface ClassStatusInfo {
  block: TimetableEvent;
  status: 'ongoing' | 'upcoming' | 'finished';
}

interface TodayClassesWidgetProps {
  classes: ClassStatusInfo[];
  currentDayLabel?: string;
  onTakeAttendance: (block: TimetableEvent) => void;
}

export const TodayClassesWidget: React.FC<TodayClassesWidgetProps> = ({
  classes,
  currentDayLabel,
  onTakeAttendance,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-orange-600 dark:text-orange-400" />
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
            {t('hub_my_day_title')}
          </h2>
          {classes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {classes.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/timetable')}
          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{t('hub_btn_view_timetable')}</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Class List or Empty State */}
      <div className="mt-4 flex-1">
        {classes.length > 0 ? (
          <div className="space-y-2.5">
            {classes.map(({ block, status }) => {
              const isOngoing = status === 'ongoing';
              const isFinished = status === 'finished';
              const isCourse = block.type === 'course';

              return (
                <div
                  key={block.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isOngoing
                      ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 shadow-xs'
                      : isFinished
                      ? 'bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/50 dark:border-slate-800/60 opacity-75'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {/* Left: Indicator, Title & Hours */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: block.color || '#ea580c' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold text-sm truncate ${
                            isFinished
                              ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {block.title}
                        </span>

                        {isOngoing && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            {t('hub_status_ongoing')}
                          </span>
                        )}

                        {isFinished && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                            <CheckCircle2 size={12} className="text-slate-400" />
                            {t('hub_status_finished')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {block.startTime} — {block.endTime}
                        </span>
                        {block.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[180px]">{block.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isCourse && (
                      <button
                        type="button"
                        onClick={() => onTakeAttendance(block)}
                        title={t('hub_btn_take_attendance')}
                        className={`h-8 px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isOngoing
                            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-200 hover:text-orange-600 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Users size={13} />
                        <span className="hidden sm:inline lg:hidden xl:inline">{t('hub_btn_take_attendance')}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Calming & useful empty state */
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col items-center justify-center text-center">
            <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200/50 dark:border-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-2.5">
              <Coffee size={22} />
            </div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {t('hub_no_classes_today')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {t('hub_no_classes_sub')}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/timetable')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-orange-600 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                {t('hub_btn_view_timetable')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/lesson-planner')}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                {t('hub_action_new_lesson')}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
