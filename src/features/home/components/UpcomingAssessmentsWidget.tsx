import React from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { CalendarCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { ClassBlock } from '../../../core/types/calendar.types';

interface UpcomingAssessmentsWidgetProps {
  todayEvents: ClassBlock[];
  upcomingAssessments: ClassBlock[];
}

export const UpcomingAssessmentsWidget: React.FC<UpcomingAssessmentsWidgetProps> = ({
  todayEvents,
  upcomingAssessments,
}) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const hasItems = todayEvents.length > 0 || upcomingAssessments.length > 0;

  return (
    <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-orange-600 dark:text-orange-400" />
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {t('hub_assessments_title')}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/calendar')}
          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{t('hub_btn_view_calendar')}</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-3.5 space-y-2">
        {/* Events happening today */}
        {todayEvents.map(evt => (
          <div
            key={evt.id}
            onClick={() => navigate('/calendar')}
            className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-800/60 transition-all cursor-pointer flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-2 h-7 rounded-full shrink-0"
                style={{ backgroundColor: evt.color || '#ea580c' }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {evt.subject}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-600 text-white shrink-0">
                    {t('hub_today_badge')}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {evt.topic || evt.notes || t('hub_scheduled_event')}
                </div>
              </div>
            </div>
            <ChevronRight size={14} className="text-orange-600 dark:text-orange-400 shrink-0" />
          </div>
        ))}

        {/* Upcoming assessments */}
        {upcomingAssessments.map(item => (
          <div
            key={item.id}
            onClick={() => navigate('/calendar')}
            className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800/60 transition-all flex items-center justify-between gap-2 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-2 h-7 rounded-full shrink-0"
                style={{ backgroundColor: item.color || '#ea580c' }}
              />
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-slate-200 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {item.subject}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.topic || item.notes || t('hub_scheduled_assessment')}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 shrink-0">
              {dayjs(item.date).locale(language).format('DD MMM')}
            </span>
          </div>
        ))}

        {!hasItems && (
          <div className="py-5 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('hub_no_events_today')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
