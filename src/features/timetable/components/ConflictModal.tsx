import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useTimetableStore } from '../store/useTimetableStore';
import { AlertTriangle, ArrowDown, ArrowLeftRight, Check, Crop } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
};

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const bounded = Math.max(0, Math.min(1439, m));
  const h = Math.floor(bounded / 60);
  const min = bounded % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export const ConflictModal: React.FC = () => {
  const { t } = useTranslation();
  const { data, conflictState, resolveConflict, closeConflictModal } = useTimetableStore();

  if (!conflictState || !conflictState.isOpen) return null;

  const { incomingEvent, conflictingEvent, fromDay, targetDay } = conflictState;
  const isDifferentDay = fromDay && fromDay !== targetDay;

  const targetDayData = data[targetDay];
  const dayEndMinutes = targetDayData?.endMinutes ?? 1020;

  const incomingStartM = timeToMinutes(incomingEvent.startTime);
  const incomingEndM = timeToMinutes(incomingEvent.endTime);

  // Projected cascade calculation for 'push'
  const dayEvents = targetDayData?.events || [];
  const eventsToPush = dayEvents.filter(e => {
    const eStart = timeToMinutes(e.startTime);
    const eEnd = timeToMinutes(e.endTime);
    const overlaps = Math.max(incomingStartM, eStart) < Math.min(incomingEndM, eEnd);
    return overlaps || eStart >= incomingStartM;
  });

  let pushEndMinutes = incomingEndM;
  const sortedToPush = [...eventsToPush].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  for (const e of sortedToPush) {
    const dur = Math.max(15, timeToMinutes(e.endTime) - timeToMinutes(e.startTime));
    const eStart = timeToMinutes(e.startTime);
    const newStart = Math.max(eStart, pushEndMinutes);
    pushEndMinutes = newStart + dur;
  }

  const pushExceedsSchedule = pushEndMinutes > dayEndMinutes;
  const pushExceedsMidnight = pushEndMinutes > 1439;
  const incomingExceedsSchedule = incomingEndM > dayEndMinutes;

  return (
    <Modal
      isOpen={conflictState.isOpen}
      onClose={closeConflictModal}
      title={t('conflict_detected')}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-sm">
          <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="font-semibold">
              {isDifferentDay
                ? `Conflicto al mover el bloque a ${DAY_LABELS[targetDay] || targetDay}:`
                : `El bloque se superpone con otro evento existente en ${DAY_LABELS[targetDay] || targetDay}:`}
            </p>
            <p className="mt-1 text-xs">
              <strong>{isDifferentDay ? `Nuevo (desde ${DAY_LABELS[fromDay]}):` : 'Nuevo:'}</strong> {incomingEvent.title} ({incomingEvent.startTime} - {incomingEvent.endTime})
              <br />
              <strong>Existente:</strong> {conflictingEvent.title} ({conflictingEvent.startTime} - {conflictingEvent.endTime})
            </p>
            {incomingExceedsSchedule && (
              <p className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 p-2 rounded-lg border border-amber-300 dark:border-amber-700 flex items-center gap-1.5">
                <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                <span>El nuevo bloque finaliza a las {incomingEvent.endTime}, excediendo el término de la jornada habitual ({minutesToTime(dayEndMinutes)}).</span>
              </p>
            )}
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          ¿Cómo deseas resolver este conflicto?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => resolveConflict('replace')}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 bg-white dark:bg-slate-900 text-left transition-all group"
          >
            <Check size={18} className="text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block group-hover:text-orange-600">
                {t('conflict_replace')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                Elimina el bloque conflictivo y coloca el nuevo en ese horario.
              </span>
            </div>
          </button>

          <button
            onClick={() => !pushExceedsMidnight && resolveConflict('push')}
            disabled={pushExceedsMidnight}
            className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all group ${
              pushExceedsMidnight
                ? 'border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40'
                : 'border-slate-200 dark:border-slate-800 hover:border-orange-500 bg-white dark:bg-slate-900'
            }`}
          >
            <ArrowDown size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block group-hover:text-orange-600">
                {t('conflict_push')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                Desplaza los bloques subsiguientes hacia abajo en cascada manteniendo su duración.
              </span>
              {pushExceedsMidnight ? (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1.5 block bg-red-50 dark:bg-red-950/50 p-1.5 rounded border border-red-200 dark:border-red-800">
                  ⛔ No permitido: desplazar los bloques superaría las 23:59 del día.
                </span>
              ) : pushExceedsSchedule ? (
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mt-1.5 block bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded border border-amber-200 dark:border-amber-800">
                  ⚠️ Extenderá el horario de clases hasta las {minutesToTime(pushEndMinutes)} (la jornada habitual finaliza a las {minutesToTime(dayEndMinutes)}).
                </span>
              ) : null}
            </div>
          </button>

          <button
            onClick={() => resolveConflict('swap')}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 bg-white dark:bg-slate-900 text-left transition-all group"
          >
            <ArrowLeftRight size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block group-hover:text-orange-600">
                {t('conflict_swap')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                {isDifferentDay
                  ? `Intercambia posiciones: "${incomingEvent.title}" va a ${DAY_LABELS[targetDay]} y "${conflictingEvent.title}" va a ${DAY_LABELS[fromDay]}.`
                  : 'Intercambia los horarios entre el bloque nuevo y el conflictivo.'}
              </span>
            </div>
          </button>

          <button
            onClick={() => resolveConflict('fit')}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 bg-white dark:bg-slate-900 text-left transition-all group"
          >
            <Crop size={18} className="text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block group-hover:text-orange-600">
                {t('conflict_fit')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                Acorta la duración del nuevo bloque para ajustarlo al espacio libre sin mover el otro.
              </span>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={closeConflictModal}>
            {t('cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

