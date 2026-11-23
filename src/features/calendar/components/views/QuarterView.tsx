import React from 'react';
import dayjs from 'dayjs';
import { ClassBlock, SubjectConfig, DayTypeInfo } from '../../../../core/types/calendar.types';
import { useTranslation } from '../../../../core/i18n/useTranslation';

interface QuarterViewProps {
  currentDate: string;
  blocks: ClassBlock[];
  subjects: Record<string, SubjectConfig>;
  dayTypes: Record<string, DayTypeInfo>;
  onEventClick: (event: ClassBlock) => void;
  onAddEventClick: (date: string) => void;
  onDayClick: (date: string) => void;
}

export const QuarterView: React.FC<QuarterViewProps> = ({
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
  // Find quarter starting month: month 0-2 (Q1), 3-5 (Q2), 6-8 (Q3), 9-11 (Q4)
  const quarterMonthStart = Math.floor(current.month() / 3) * 3;
  const quarterMonths = [0, 1, 2].map(offset => current.month(quarterMonthStart + offset));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {quarterMonths.map(mDate => {
        const startOfMonth = mDate.startOf('month');
        const endOfMonth = mDate.endOf('month');
        const startDayOfWeek = (startOfMonth.day() + 6) % 7;
        const daysInMonth = endOfMonth.date();
        const totalGridCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
        const gridDays = Array.from({ length: totalGridCells }, (_, i) => {
          const dayOffset = i - startDayOfWeek + 1;
          return startOfMonth.date(dayOffset);
        });

        return (
          <div
            key={mDate.format('YYYY-MM')}
            className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 capitalize">
                {mDate.format('MMMM YYYY')}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {blocks.filter(b => b.date.startsWith(mDate.format('YYYY-MM'))).length} {t('classes_count')}
              </span>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 py-2 border-b border-slate-100 dark:border-slate-800 text-center text-[10px] font-bold text-slate-400">
              {weekdays.map(wd => (
                <div key={wd}>{wd}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 pt-2">
              {gridDays.map(dayObj => {
                const dateStr = dayObj.format('YYYY-MM-DD');
                const isCurrentMonth = dayObj.month() === mDate.month();
                const isToday = dayObj.isSame(dayjs(), 'day');
                const dayInfo = dayTypes[dateStr];
                const dayBlocks = blocks.filter(b => b.date === dateStr && subjects[b.subject]?.visible !== false);

                return (
                  <div
                    key={dateStr}
                    onClick={() => onDayClick(dateStr)}
                    className={`min-h-[64px] p-1 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      isCurrentMonth
                        ? isToday
                          ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20'
                          : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/60'
                        : 'border-transparent opacity-20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold font-mono ${isToday ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {dayObj.date()}
                      </span>
                      {dayInfo && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: dayInfo.color || '#ff9800' }}
                          title={dayInfo.note || dayInfo.type}
                        />
                      )}
                    </div>

                    {/* Class Dots/Bars */}
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {dayBlocks.slice(0, 2).map(b => (
                        <div
                          key={b.id}
                          onClick={e => {
                            e.stopPropagation();
                            onEventClick(b);
                          }}
                          className="px-1 py-0.2 rounded text-[8px] font-bold text-white truncate"
                          style={{ backgroundColor: b.color || subjects[b.subject]?.color || '#1abc9c' }}
                          title={`${b.subject}: ${b.topic}`}
                        >
                          {b.topic}
                        </div>
                      ))}
                      {dayBlocks.length > 2 && (
                        <span className="text-[8px] text-slate-400 font-bold text-center">
                          +{dayBlocks.length - 2}
                        </span>
                      )}
                    </div>
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
