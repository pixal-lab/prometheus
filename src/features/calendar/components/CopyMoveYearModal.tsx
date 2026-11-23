import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useCalendarStore } from '../store/useCalendarStore';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { ArrowRight, Check } from 'lucide-react';

interface CopyMoveYearModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CopyMoveYearModal: React.FC<CopyMoveYearModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { schoolYears, subjects, copyOrMoveYearEvents } = useCalendarStore();

  const [sourceYearId, setSourceYearId] = useState<number>(schoolYears[0]?.id || 0);
  const [targetYearId, setTargetYearId] = useState<number>(schoolYears[1]?.id || schoolYears[0]?.id || 0);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(Object.keys(subjects));
  const [action, setAction] = useState<'copy' | 'move'>('copy');

  const handleSelectAll = (checked: boolean) => {
    setSelectedSubjects(checked ? Object.keys(subjects) : []);
  };

  const handleToggleSubject = (name: string) => {
    setSelectedSubjects(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleProceed = async () => {
    if (sourceYearId === targetYearId) {
      showToast('El año de origen y de destino no pueden ser el mismo', 'warning');
      return;
    }
    if (selectedSubjects.length === 0) {
      showToast('Selecciona al menos una asignatura', 'warning');
      return;
    }

    const count = await copyOrMoveYearEvents(sourceYearId, targetYearId, selectedSubjects, action);
    showToast(`${count} eventos transferidos exitosamente`, 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('copy_move_title')}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('source_year')}
            </label>
            <select
              value={sourceYearId}
              onChange={e => setSourceYearId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {schoolYears.map(y => (
                <option key={y.id} value={y.id}>
                  {y.name} ({y.startDate} a {y.endDate})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('target_year')}
            </label>
            <select
              value={targetYearId}
              onChange={e => setTargetYearId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {schoolYears.map(y => (
                <option key={y.id} value={y.id}>
                  {y.name} ({y.startDate} a {y.endDate})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subjects selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('subjects_to_transfer')}
            </label>
            <button
              type="button"
              onClick={() => handleSelectAll(selectedSubjects.length !== Object.keys(subjects).length)}
              className="text-xs text-orange-600 dark:text-orange-400 font-semibold hover:underline"
            >
              {selectedSubjects.length === Object.keys(subjects).length ? t('deselect_all') : t('select_all')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
            {Object.keys(subjects).map(sub => (
              <label key={sub} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(sub)}
                  onChange={() => handleToggleSubject(sub)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="truncate">{sub}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Choice */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('action_label')}</label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="radio"
                name="copy-move"
                value="copy"
                checked={action === 'copy'}
                onChange={() => setAction('copy')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span>{t('copy_keep_original')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input
                type="radio"
                name="copy-move"
                value="move"
                checked={action === 'move'}
                onChange={() => setAction('move')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span>{t('move_delete_original')}</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" onClick={handleProceed}>
            <Check size={16} /> {t('confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

