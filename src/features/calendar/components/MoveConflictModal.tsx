import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { AlertCircle, ArrowRight, FastForward } from 'lucide-react';

interface MoveConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  targetDate: string;
  onMoveSingle: () => void;
  onMoveCascade: () => void;
}

export const MoveConflictModal: React.FC<MoveConflictModalProps> = ({
  isOpen,
  onClose,
  topic,
  targetDate,
  onMoveSingle,
  onMoveCascade,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conflicto de Evento en Calendario" maxWidth="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle className="shrink-0 text-amber-600 mt-0.5" size={16} />
          <p>
            Ya existen clases programadas en el día <strong>{targetDate}</strong>. ¿Cómo deseas desplazar la clase de <strong>"{topic}"</strong>?
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              onMoveSingle();
              onClose();
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/30 text-left transition-colors cursor-pointer"
          >
            <ArrowRight size={18} className="text-orange-600 shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                Mover solo este evento
              </span>
              <span className="text-[11px] text-slate-400">
                Solo se desplazará esta clase; el resto del cronograma permanecerá inalterado.
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              onMoveCascade();
              onClose();
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-orange-500 hover:bg-orange-50/50 dark:hover:bg-orange-950/30 text-left transition-colors cursor-pointer"
          >
            <FastForward size={18} className="text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                Mover todos los eventos subsiguientes
              </span>
              <span className="text-[11px] text-slate-400">
                Empuja en cascada todas las clases posteriores de este curso hacia adelante.
              </span>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
