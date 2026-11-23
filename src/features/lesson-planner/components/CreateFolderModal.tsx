import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useLessonPlannerStore } from '../store/useLessonPlannerStore';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { FolderPlus } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentPath: string[];
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  parentPath,
}) => {
  const { t } = useTranslation();
  const { createFolder } = useLessonPlannerStore();
  const { showToast } = useToast();
  const [folderName, setFolderName] = useState('');

  const isCourse = parentPath.length === 0;
  const isSubject = parentPath.length === 1;

  const title = isCourse
    ? t('create_folder_course')
    : isSubject
    ? t('create_folder_subject')
    : t('create_folder_unit');

  const placeholder = isCourse
    ? 'Ej: 6th Grade / 1° Medio'
    : isSubject
    ? 'Ej: Matemáticas / Historia'
    : 'Ej: Unidad 2: Geometría';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    await createFolder(parentPath, folderName.trim());
    showToast(`Carpeta "${folderName.trim()}" creada con éxito`, 'success');
    setFolderName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('folder_name_label')}
          </label>
          <input
            type="text"
            required
            autoFocus
            value={folderName}
            onChange={e => setFolderName(e.target.value)}
            placeholder={placeholder}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" size="sm">
            <FolderPlus size={16} /> {t('create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
