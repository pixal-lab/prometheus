import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Course, CategoryWeight } from '../../../core/types/gradebook.types';
import { useGradebookStore } from '../store/useGradebookStore';
import { useToast } from '../../../components/ui/Toast';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface CategoryWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
}

export const CategoryWeightsModal: React.FC<CategoryWeightsModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { updateCourseCategories } = useGradebookStore();

  const [categories, setCategories] = useState<CategoryWeight[]>(course.categories || []);

  const totalWeight = categories.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);

  const handleAdd = () => {
    setCategories([
      ...categories,
      { id: Date.now(), name: 'Nueva Categoría', weight: 10 },
    ]);
  };

  const handleChange = (id: number, field: 'name' | 'weight', val: string | number) => {
    setCategories(
      categories.map(c => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleDelete = (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    await updateCourseCategories(course.id, categories);
    showToast('Ponderaciones guardadas', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ponderaciones - ${course.name}`}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Define las categorías de evaluación y sus porcentajes para el promedio ponderado.
          </p>
          <Button onClick={handleAdd} variant="outline" size="sm">
            <Plus size={14} /> Añadir
          </Button>
        </div>

        <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3">
              <input
                type="text"
                value={cat.name}
                onChange={e => handleChange(cat.id, 'name', e.target.value)}
                placeholder="Nombre categoría"
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex items-center gap-1 w-24">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={cat.weight}
                  onChange={e => handleChange(cat.id, 'weight', parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-right"
                />
                <span className="text-xs text-slate-400 font-bold">%</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Sum Indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold">
          <span>Suma total de ponderaciones:</span>
          <span
            className={`font-mono text-sm ${
              totalWeight === 100
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {totalWeight}% {totalWeight === 100 ? '✓' : '(Se recomienda 100%)'}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

