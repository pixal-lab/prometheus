import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useTimetableStore } from '../store/useTimetableStore';
import { DayOfWeek } from '../../../core/types/timetable.types';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { Clock, Check } from 'lucide-react';

interface DayHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
];

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export const DayHoursModal: React.FC<DayHoursModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { data, updateDayHours, updateAllDayHours } = useTimetableStore();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'general' | 'daily'>('general');

  // General tab state
  const [generalStart, setGeneralStart] = useState('08:00');
  const [generalEnd, setGeneralEnd] = useState('17:00');

  // Daily tab state
  const [dailyHours, setDailyHours] = useState<Record<DayOfWeek, { start: string; end: string }>>(() => {
    const init: Record<string, { start: string; end: string }> = {};
    for (const d of DAYS) {
      init[d.key] = {
        start: minutesToTimeString(data[d.key]?.startMinutes ?? 480),
        end: minutesToTimeString(data[d.key]?.endMinutes ?? 1020),
      };
    }
    return init as Record<DayOfWeek, { start: string; end: string }>;
  });

  const handleApplyGeneral = async () => {
    const startM = timeStringToMinutes(generalStart);
    const endM = timeStringToMinutes(generalEnd);
    if (startM >= endM) {
      showToast('La hora de inicio debe ser anterior a la hora de término', 'warning');
      return;
    }
    await updateAllDayHours(startM, endM);
    showToast('Horario aplicado a todos los días hábiles', 'success');
    onClose();
  };

  const handleApplyDaily = async () => {
    for (const d of DAYS) {
      const startM = timeStringToMinutes(dailyHours[d.key].start);
      const endM = timeStringToMinutes(dailyHours[d.key].end);
      if (startM >= endM) {
        showToast(`En ${d.label}, la hora de inicio debe ser anterior a la de término`, 'warning');
        return;
      }
      await updateDayHours(d.key, startM, endM);
    }
    showToast('Horarios diarios actualizados con éxito', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('day_hours_title')} maxWidth="md">
      <div className="flex flex-col gap-5">
        {/* Tab selection */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'general'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('general_weekly')}
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('daily_specific')}
          </button>
        </div>

        {activeTab === 'general' ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-500">
              Establece la jornada escolar para todos los días de la semana (Lunes a Viernes).
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Hora de Inicio:
                </label>
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50/50 dark:bg-slate-900">
                  <Clock size={16} className="text-slate-400" />
                  <input
                    type="time"
                    value={generalStart}
                    onChange={e => setGeneralStart(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Hora de Término:
                </label>
                <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 bg-slate-50/50 dark:bg-slate-900">
                  <Clock size={16} className="text-slate-400" />
                  <input
                    type="time"
                    value={generalEnd}
                    onChange={e => setGeneralEnd(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button onClick={onClose} variant="ghost" size="sm">
                {t('cancel')}
              </Button>
              <Button onClick={handleApplyGeneral} variant="primary" size="sm">
                <Check size={16} /> {t('apply_to_all_days')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-500">
              Personaliza el rango horario individual para cada día escolar.
            </p>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {DAYS.map(day => (
                <div
                  key={day.key}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40"
                >
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-20">
                    {t(day.key)}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dailyHours[day.key].start}
                      onChange={e =>
                        setDailyHours(prev => ({
                          ...prev,
                          [day.key]: { ...prev[day.key], start: e.target.value },
                        }))
                      }
                      className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                    <span className="text-slate-400 text-xs">a</span>
                    <input
                      type="time"
                      value={dailyHours[day.key].end}
                      onChange={e =>
                        setDailyHours(prev => ({
                          ...prev,
                          [day.key]: { ...prev[day.key], end: e.target.value },
                        }))
                      }
                      className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button onClick={onClose} variant="ghost" size="sm">
                {t('cancel')}
              </Button>
              <Button onClick={handleApplyDaily} variant="primary" size="sm">
                <Check size={16} /> {t('save_daily_hours')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
