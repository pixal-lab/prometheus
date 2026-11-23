import React from 'react';
import { Flame, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface HomeHeaderProps {
  greeting: string;
  formattedToday: string;
  classesCount: number;
  ongoingClassTitle?: string;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  greeting,
  formattedToday,
  classesCount,
  ongoingClassTitle,
}) => {
  const { t } = useTranslation();

  return (
    <header className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Saludo y contexto del día */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400">
              <Flame size={14} className="fill-orange-500 text-orange-600" />
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {greeting}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pl-8">
            {classesCount > 0 ? (
              ongoingClassTitle ? (
                <span>
                  {t('hub_header_ongoing_class')}{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{ongoingClassTitle}</strong>
                </span>
              ) : (
                <span>
                  {t('hub_header_have_prefix')}{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{classesCount}</strong>{' '}
                  {classesCount === 1 ? t('hub_header_block_single') : t('hub_header_blocks_plural')}{' '}
                  {t('hub_header_for_today')}
                </span>
              )
            ) : (
              <span>{t('hub_no_classes_sub')}</span>
            )}
          </p>
        </div>

        {/* Right: Fecha formateada elegante */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <CalendarIcon size={14} className="text-orange-600 dark:text-orange-400" />
            <span>{formattedToday}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
