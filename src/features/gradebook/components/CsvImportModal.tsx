import React, { useState } from 'react';
import Papa from 'papaparse';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useGradebookStore } from '../store/useGradebookStore';
import { useToast } from '../../../components/ui/Toast';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, courseId }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { addStudentsBulk } = useGradebookStore();

  const [parsedNames, setParsedNames] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        const names: string[] = [];

        // Ignorar encabezados si la primera fila dice "Nombre" o "Name"
        const startIdx = rows.length > 0 && /nombre|name|estudiante|alumno/i.test(rows[0][0]) ? 1 : 0;

        for (let i = startIdx; i < rows.length; i++) {
          const row = rows[i];
          if (row[0] && row[0].trim()) {
            names.push(row[0].trim());
          }
        }

        setParsedNames(names);
      },
      error: () => {
        showToast('Error al leer el archivo CSV', 'error');
      },
    });
  };

  const handleImport = async () => {
    if (parsedNames.length === 0) return;
    await addStudentsBulk(parsedNames, courseId);
    showToast(`${parsedNames.length} estudiantes importados con éxito`, 'success');
    onClose();
    setParsedNames([]);
    setFileName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('import_csv')}>
      <div className="flex flex-col gap-5">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
          Sube un archivo <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">.csv</code> con la nómina de tus alumnos. La primera columna debe contener los nombres de los estudiantes.
        </div>

        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
          <FileSpreadsheet className="text-orange-500 mb-2" size={32} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {fileName || 'Seleccionar archivo CSV'}
          </span>
          <span className="text-xs text-slate-400 mt-0.5">Formatos compatibles: .csv</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        {parsedNames.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Vista previa ({parsedNames.length} alumnos detectados):
            </span>
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900 text-xs flex flex-col gap-1">
              {parsedNames.slice(0, 15).map((n, i) => (
                <span key={i} className="text-slate-700 dark:text-slate-300">
                  {i + 1}. {n}
                </span>
              ))}
              {parsedNames.length > 15 && (
                <span className="text-slate-400 italic">... y {parsedNames.length - 15} más</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={parsedNames.length === 0}
          >
            <Check size={16} /> Importar {parsedNames.length} Estudiantes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

