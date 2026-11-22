import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { storage } from '../../../core/storage/dexieStorage';
import { LessonPlannerData, LessonItem } from '../../../core/types/lesson.types';
import { Folder, FileText, ChevronRight, ChevronDown, Check, Search } from 'lucide-react';

interface LessonPlanPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (lesson: { id: string; title: string; content?: any }) => void;
}

export const LessonPlanPickerModal: React.FC<LessonPlanPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [data, setData] = useState<LessonPlannerData>({});
  const [selectedLesson, setSelectedLesson] = useState<{ id: string; title: string; content?: any } | null>(null);
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      storage.getItem<LessonPlannerData>('lessonPlannerData').then(res => {
        if (res) setData(res);
      });
    }
  }, [isOpen]);

  const toggleFolder = (pathKey: string) => {
    setOpenFolders(prev => ({ ...prev, [pathKey]: !prev[pathKey] }));
  };

  const handleConfirm = () => {
    if (selectedLesson) {
      onSelect(selectedLesson);
      onClose();
    }
  };

  const renderTree = (node: any, path: string[] = []): React.ReactNode => {
    if (!node) return null;

    if ('content' in node) {
      const isSelected = selectedLesson?.id === node.id || selectedLesson?.title === node.title;
      if (search && !node.title.toLowerCase().includes(search.toLowerCase())) return null;

      return (
        <div
          key={node.id || path.join('/')}
          onClick={() => setSelectedLesson({ id: node.id || path.join('/'), title: node.title, content: node.content })}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
            isSelected
              ? 'bg-orange-500 text-white shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <FileText size={15} className={isSelected ? 'text-white' : 'text-orange-500'} />
          <span className="truncate">{node.title}</span>
        </div>
      );
    }

    const folderName = path[path.length - 1] || 'Inicio';
    const pathKey = path.join('/');
    const isOpenFolder = openFolders[pathKey] !== false; // open by default
    const children = node.children || node;

    return (
      <div key={pathKey || 'root'} className="flex flex-col gap-1 pl-3 border-l border-slate-200 dark:border-slate-800 ml-1">
        {path.length > 0 && (
          <div
            onClick={() => toggleFolder(pathKey)}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none"
          >
            {isOpenFolder ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Folder size={15} className="text-amber-500" />
            <span className="truncate">{folderName}</span>
          </div>
        )}

        {isOpenFolder && (
          <div className="flex flex-col gap-1 pl-2">
            {Object.entries(children).map(([childKey, childNode]: [string, any]) => {
              if (childKey === 'collapsed' || childKey === 'id' || childKey === 'name' || childKey === 'type') return null;
              return renderTree(childNode, [...path, childKey]);
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Seleccionar Plan de Lección" maxWidth="lg">
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-500">
          Explora la jerarquía de planes de clase para vincular los objetivos y actividades directamente a esta sesión en el calendario.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Buscar por título de lección..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Tree container */}
        <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
          {Object.keys(data).length > 0 ? (
            Object.entries(data).map(([courseKey, courseNode]) => renderTree(courseNode, [courseKey]))
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No hay planes de lección creados en el Planificador.
            </div>
          )}
        </div>

        {selectedLesson && (
          <div className="p-3 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl text-xs flex items-center justify-between">
            <span className="font-semibold text-orange-900 dark:text-orange-200 truncate">
              Seleccionado: <strong>{selectedLesson.title}</strong>
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedLesson} variant="primary" size="sm">
            <Check size={14} /> Vincular Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
};
