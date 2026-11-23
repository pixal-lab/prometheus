import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useGradebookStore } from '../store/useGradebookStore';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { UserPlus } from 'lucide-react';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseName,
}) => {
  const { t } = useTranslation();
  const { addStudent } = useGradebookStore();
  const { showToast } = useToast();

  const [studentName, setStudentName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;

    await addStudent(studentName.trim(), courseId);
    showToast(`Estudiante "${studentName.trim()}" añadido al curso ${courseName}`, 'success');
    setStudentName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${t('add_student_title')} (${courseName})`} maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('student_fullname_label')}
          </label>
          <input
            type="text"
            required
            autoFocus
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder="Ej: Gabriela Mistral"
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" size="sm">
            <UserPlus size={16} /> {t('save_student_btn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
