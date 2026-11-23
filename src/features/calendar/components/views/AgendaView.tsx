import React from 'react';
import dayjs from 'dayjs';
import { ClassBlock, SubjectConfig } from '../../../../core/types/calendar.types';
import { Award, Calendar } from 'lucide-react';
import { useTranslation } from '../../../../core/i18n/useTranslation';

interface AgendaViewProps {
  currentDate: string;
  blocks: ClassBlock[];
  subjects: Record<string, SubjectConfig>;
  onEventClick: (event: ClassBlock) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  currentDate,
  blocks,
  subjects,
  onEventClick,
}) => {
  const { t } = useTranslation();
  const current = dayjs(currentDate);
  const start = current.startOf('month');
  const end = current.endOf('month');

  // Filter and group by date
  const monthBlocks = blocks
    .filter(b => {
      const d = dayjs(b.date);
      return (
        d.isAfter(start.subtract(1, 'day')) &&
        d.isBefore(end.add(1, 'day')) &&
        subjects[b.subject]?.visible !== false
      );
    })
    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

  const grouped: Record<string, ClassBlock[]> = {};
  monthBlocks.forEach(b => {
    if (!grouped[b.date]) grouped[b.date] = [];
    grouped[b.date].push(b);
  });

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
      {Object.entries(grouped).map(([date, dayBlocks]) => {
        const dObj = dayjs(date);
        const isToday = dObj.isSame(dayjs(), 'day');

        return (
          <div
            key={date}
            className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
          >
            {/* Date Tag */}
            <div className="sm:w-32 shrink-0 flex items-center sm:flex-col sm:items-start gap-2">
              <span className={`text-2xl font-black font-mono leading-none ${isToday ? 'text-orange-600' : 'text-slate-800 dark:text-slate-100'}`}>
                {dObj.format('DD')}
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {dObj.format('dddd')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {dObj.format('MMMM YYYY')}
                </span>
              </div>
            </div>

            {/* Blocks List */}
            <div className="flex-1 flex flex-col gap-2">
              {dayBlocks.map(block => (
                <div
                  key={block.id}
                  onClick={() => onEventClick(block)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 bg-slate-50 dark:bg-slate-800/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: block.color || subjects[block.subject]?.color || '#1abc9c' }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 transition-colors">
                        {block.topic}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {block.subject}
                      </span>
                    </div>
                  </div>

                  {block.evaluation && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                      <Award size={13} /> {t('include_evaluation')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {Object.keys(grouped).length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          {t('no_classes_month')}
        </div>
      )}
    </div>
  );
};

