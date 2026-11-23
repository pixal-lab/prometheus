import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCalendarStore } from '../store/useCalendarStore';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { MoveHorizontal } from 'lucide-react';

interface MoveSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
}

export const MoveSubjectModal: React.FC<MoveSubjectModalProps> = ({ isOpen, onClose, subject }) => {
  const { t } = useTranslation();
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('move_course_title')} maxWidth="md">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Mover todas las clases de <strong className="text-orange-600">{subject}</strong> hacia adelante o hacia atrás respetando los días hábiles lectivos (Lunes a Viernes).
        </p>

        <div className="flex flex-col gap-1.5">
          <Input
            label={t('days_to_shift')}
            type="number"
            step="1"
            icon={<MoveHorizontal size={15} className="text-orange-500" />}
            value={daysToMove}
            onChange={e => setDaysToMove(parseInt(e.target.value) || 0)}
            className="font-mono font-bold"
          />
          <span className="text-[10px] text-slate-400">
            {t('days_to_shift_hint')}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            {t('cancel')}
          </Button>
          <Button onClick={handleConfirm} variant="primary" size="sm">
            <MoveHorizontal size={14} /> {t('move_course_btn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
