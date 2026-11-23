import React, { useRef, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { BackupService } from '../../core/storage/backupService';
import { useToast } from '../../components/ui/Toast';
import { useTranslation } from '../../core/i18n/useTranslation';
import { Download, Upload, AlertCircle } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose, onDataImported }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    try {
      await BackupService.exportFullBackup();
      showToast('Copia de seguridad descargada con éxito', 'success');
      onClose();
    } catch {
      showToast('Error al exportar los datos', 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const res = await BackupService.importBackup(text);
        if (res.success) {
          showToast(`Respaldo restaurado: ${res.count} eventos cargados`, 'success');
          onDataImported?.();
          onClose();
        } else {
          showToast(res.message, 'error');
        }
      } catch {
        showToast('Formato de archivo inválido', 'error');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('backup_title')}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3 p-3.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-900 dark:text-orange-200 text-sm">
          <AlertCircle className="shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" size={18} />
          <p>
            {t('backup_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Download size={18} className="text-orange-600" /> {t('export_json')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('export_json_desc')}
              </p>
            </div>
            <Button onClick={handleExport} variant="primary">
              <Download size={16} /> {t('download_backup')}
            </Button>
          </div>

          <div className="flex flex-col p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Upload size={18} className="text-blue-600" /> {t('import_json')}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('import_json_desc')}
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={isImporting}
            >
              <Upload size={16} /> {isImporting ? t('loading_file') : t('select_file')}
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

