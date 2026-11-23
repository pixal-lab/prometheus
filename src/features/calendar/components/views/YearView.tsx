import React from 'react';
import dayjs from 'dayjs';
import { ClassBlock, SubjectConfig, DayTypeInfo } from '../../../../core/types/calendar.types';
import { useTranslation } from '../../../../core/i18n/useTranslation';

interface YearViewProps {
  currentDate: string;
  blocks: ClassBlock[];
  subjects: Record<string, SubjectConfig>;
  dayTypes: Record<string, DayTypeInfo>;
  onEventClick: (event: ClassBlock) => void;
  onAddEventClick: (date: string) => void;
  onDayClick: (date: string) => void;
}

export const YearView: React.FC<YearViewProps> = ({
  currentDate,
  blocks,
  subjects,
  dayTypes,
  onEventClick,
  onAddEventClick,
  onDayClick,
}) => {
  const { t } = useTranslation();
  const weekdays = [
    t('mon_short').charAt(0),
    t('tue_short').charAt(0),
    t('wed_short').charAt(0),
    t('thu_short').charAt(0),
    t('fri_short').charAt(0),
    t('sat_short').charAt(0),
    t('sun_short').charAt(0),
  ];
  const current = dayjs(currentDate);
  const year = current.year();
  const months = Array.from({ length: 12 }, (_, i) => dayjs(`${year}-${String(i + 1).padStart(2, '0')}-01`));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {months.map(mDate => {
        const startOfMonth = mDate.startOf('month');
        const endOfMonth = mDate.endOf('month');
        const startDayOfWeek = (startOfMonth.day() + 6) % 7;
        const daysInMonth = endOfMonth.date();
        const totalGridCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
        const gridDays = Array.from({ length: totalGridCells }, (_, i) => {
          const dayOffset = i - startDayOfWeek + 1;
          return startOfMonth.date(dayOffset);
        });

        const monthBlocksCount = blocks.filter(b => b.date.startsWith(mDate.format('YYYY-MM'))).length;

        return (
          <div
            key={mDate.format('YYYY-MM')}
            className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 capitalize">
                {mDate.format('MMMM')}
              </h4>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {monthBlocksCount > 0 ? `${monthBlocksCount} ${t('classes_count_short')}` : ''}
              </span>
            </div>

            <div className="grid grid-cols-7 py-1.5 border-b border-slate-100 dark:border-slate-800 text-center text-[9px] font-bold text-slate-400">
              {weekdays.map(wd => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 pt-1.5">
              {gridDays.map(dayObj => {
                const dateStr = dayObj.format('YYYY-MM-DD');
                const isCurrentMonth = dayObj.month() === mDate.month();
                const isToday = dayObj.isSame(dayjs(), 'day');
                const dayInfo = dayTypes[dateStr];
                const dayBlocks = blocks.filter(b => b.date === dateStr && subjects[b.subject]?.visible !== false);

                return (
                  <div
                    key={dateStr}
                    onClick={() => isCurrentMonth && onDayClick(dateStr)}
                    className={`h-7 rounded flex flex-col items-center justify-center relative cursor-pointer transition-colors ${
                      isCurrentMonth
                        ? isToday
                          ? 'bg-orange-500 text-white font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'opacity-10 text-slate-400 cursor-default'
                    }`}
                  >
                    <span className="text-[10px] font-mono leading-none">{dayObj.date()}</span>

                    {/* Dot indicators */}
                    {isCurrentMonth && (dayBlocks.length > 0 || dayInfo) && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {dayInfo && (
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: dayInfo.color || '#ff9800' }}
                          />
                        )}
                        {dayBlocks.length > 0 && (
                          <div
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: isToday ? '#ffffff' : (dayBlocks[0].color || subjects[dayBlocks[0].subject]?.color || '#1abc9c') }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
