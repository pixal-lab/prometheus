import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useGradebookStore } from '../store/useGradebookStore';
import { useToast } from '../../../components/ui/Toast';
import { Plus } from 'lucide-react';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose }) => {
  const { addCourse } = useGradebookStore();
  const { showToast } = useToast();

  const [courseName, setCourseName] = useState('');
  const [subjectsStr, setSubjectsStr] = useState('Matemáticas, Ciencias, Historia, Lenguaje, Inglés');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    await addCourse(courseName.trim(), subjectsStr.trim());
    showToast(`Curso "${courseName.trim()}" creado con éxito`, 'success');
    setCourseName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Curso" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Nombre del Curso:
          </label>
          <input
            type="text"
            required
            autoFocus
            value={courseName}
            onChange={e => setCourseName(e.target.value)}
            placeholder="Ej: 6th Grade B / 1° Medio A"
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Asignaturas (separadas por comas):
          </label>
          <textarea
            rows={3}
            required
            value={subjectsStr}
            onChange={e => setSubjectsStr(e.target.value)}
            placeholder="Ej: Matemáticas, Ciencias Naturales, Historia, Lenguaje, Artes"
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-[11px] text-slate-400">
            Define las asignaturas en las que se registrarán las notas de los estudiantes de este curso.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm">
            <Plus size={16} /> Crear Curso
          </Button>
        </div>
      </form>
    </Modal>
  );
};
