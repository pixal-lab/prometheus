import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useTimetableStore } from '../store/useTimetableStore';
import { AlertTriangle, ArrowDown, ArrowLeftRight, Check, Crop } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

export const ConflictModal: React.FC = () => {
  const { t } = useTranslation();
  const { conflictState, resolveConflict, closeConflictModal } = useTimetableStore();

  if (!conflictState || !conflictState.isOpen) return null;

  const { incomingEvent, conflictingEvent } = conflictState;

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
          <div>
            <p className="font-semibold">El bloque se superpone con otro evento existente:</p>
            <p className="mt-1 text-xs">
              <strong>Nuevo:</strong> {incomingEvent.title} ({incomingEvent.startTime} - {incomingEvent.endTime})
              <br />
              <strong>Existente:</strong> {conflictingEvent.title} ({conflictingEvent.startTime} - {conflictingEvent.endTime})
            </p>
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
                Elimina el bloque anterior y coloca el nuevo en ese horario.
              </span>
            </div>
          </button>

          <button
            onClick={() => resolveConflict('push')}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 bg-white dark:bg-slate-900 text-left transition-all group"
          >
            <ArrowDown size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 block group-hover:text-orange-600">
                {t('conflict_push')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                Desplaza los bloques subsiguientes hacia abajo manteniendo su duración.
              </span>
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
                Intercambia los horarios entre el bloque nuevo y el conflictivo.
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
                Acorta la duración del nuevo bloque para ajustarlo al espacio disponible.
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

