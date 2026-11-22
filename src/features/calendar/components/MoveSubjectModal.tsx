import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useCalendarStore } from '../store/useCalendarStore';
import { useToast } from '../../../components/ui/Toast';
import { MoveHorizontal } from 'lucide-react';

interface MoveSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
}

export const MoveSubjectModal: React.FC<MoveSubjectModalProps> = ({ isOpen, onClose, subject }) => {
  const { moveSubjectBlocks } = useCalendarStore();
  const { showToast } = useToast();
  const [daysToMove, setDaysToMove] = useState(1);

  const handleConfirm = async () => {
    if (daysToMove === 0) {
      onClose();
      return;
    }
    const count = await moveSubjectBlocks(subject, daysToMove);
    showToast(`${count} clases de "${subject}" desplazadas ${daysToMove} días hábiles`, 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mover Curso Completo" maxWidth="md">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Mover todas las clases de <strong className="text-orange-600">{subject}</strong> hacia adelante o hacia atrás respetando los días hábiles lectivos (Lunes a Viernes).
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Número de días hábiles a desplazar:
          </label>
          <input
            type="number"
            step="1"
            value={daysToMove}
            onChange={e => setDaysToMove(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
          />
          <span className="text-[10px] text-slate-400">
            Usa valores positivos para avanzar hacia el futuro o negativos para retroceder.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} variant="primary" size="sm">
            <MoveHorizontal size={14} /> Mover Curso
          </Button>
        </div>
      </div>
    </Modal>
  );
};
