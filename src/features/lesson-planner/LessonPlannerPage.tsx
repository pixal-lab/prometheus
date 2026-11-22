import React, { useEffect, useState } from 'react';
import { useLessonPlannerStore } from './store/useLessonPlannerStore';
import { TreeNode } from './components/LessonTree';
import { LessonEditor } from './components/LessonEditor';
import { CreateLessonModal } from './components/CreateLessonModal';
import { CreateFolderModal } from './components/CreateFolderModal';
import { Button } from '../../components/ui/Button';
import { FolderPlus, Plus, Search, BookOpen, Sparkles } from 'lucide-react';
import { LessonItem } from '../../core/types/lesson.types';
import { useTranslation } from '../../core/i18n/useTranslation';

export const LessonPlannerPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    data,
    activeLessonPath,
    searchQuery,
    setSearchQuery,
    loadData,
    isLoading,
  } = useLessonPlannerStore();

  const [activeLesson, setActiveLesson] = useState<LessonItem | null>(null);
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [createFolderParentPath, setCreateFolderParentPath] = useState<string[]>([]);

  // Draggable sidebar width state
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeLessonPath.length === 0) {
      setActiveLesson(null);
      return;
    }

    let current: any = data;
    for (let i = 0; i < activeLessonPath.length; i++) {
      const seg = activeLessonPath[i];
      if (current.children) current = current.children[seg];
      else if (current[seg]) current = current[seg];
    }

    if (current && 'content' in current) {
      setActiveLesson(current as LessonItem);
    } else {
      setActiveLesson(null);
    }
  }, [data, activeLessonPath]);

  // Sidebar drag resizer
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(240, Math.min(550, e.clientX - 40));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizing) setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleOpenAddCourse = () => {
    setCreateFolderParentPath([]);
    setIsCreateFolderOpen(true);
  };

  const handleOpenCreateLesson = () => {
    setIsCreateLessonOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-slate-400">Cargando lecciones...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[750px] relative select-none">
      {/* Left Sidebar: Folder & Lesson Tree */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="w-full lg:shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
            <BookOpen size={17} className="text-orange-600" /> {t('my_lessons')}
          </h2>
          <div className="flex items-center gap-1">
            <Button onClick={handleOpenAddCourse} variant="outline" size="sm" title="Añadir Carpeta de Curso">
              <FolderPlus size={15} />
            </Button>
            <Button onClick={handleOpenCreateLesson} variant="primary" size="sm" title="Crear Nueva Lección">
              <Plus size={15} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder={t('search_lessons')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Tree Container */}
        <div className="flex-1 overflow-y-auto max-h-[600px] flex flex-col gap-1 pr-1">
          {Object.entries(data).map(([folderKey, folderNode]) => (
            <TreeNode
              key={folderKey}
              name={folderKey}
              node={folderNode}
              path={[folderKey]}
              filter={searchQuery}
            />
          ))}

          {Object.keys(data).length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No hay carpetas creadas. Pulsa el botón de arriba para crear tu primer curso.
            </div>
          )}
        </div>
      </aside>

      {/* Draggable divider handle for desktop */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="hidden lg:flex w-2 hover:w-2 hover:bg-orange-500/20 active:bg-orange-500/40 cursor-col-resize items-center justify-center transition-colors group select-none"
        title="Arrastra para redimensionar el panel de lecciones"
      >
        <div className="w-1 h-10 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-orange-500 transition-colors" />
      </div>

      {/* Right Content: Lesson Editor or Welcome Screen */}
      <main className="flex-1 min-w-0">
        {activeLesson ? (
          <LessonEditor lesson={activeLesson} path={activeLessonPath} />
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 mb-4">
              <BookOpen size={30} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Bienvenido al Planificador de Lecciones
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6">
              Selecciona una lección del árbol de la izquierda para editarla, o crea una nueva lección estructurada con momentos pedagógicos.
            </p>
            <Button onClick={handleOpenCreateLesson} variant="primary">
              <Sparkles size={16} /> Crear Lección Estructurada
            </Button>
          </div>
        )}
      </main>

      {/* Modals */}
      {isCreateLessonOpen && (
        <CreateLessonModal
          isOpen={isCreateLessonOpen}
          onClose={() => setIsCreateLessonOpen(false)}
          defaultCourse={activeLessonPath[0] || ''}
          defaultSubject={activeLessonPath[1] || ''}
        />
      )}

      {isCreateFolderOpen && (
        <CreateFolderModal
          isOpen={isCreateFolderOpen}
          onClose={() => setIsCreateFolderOpen(false)}
          parentPath={createFolderParentPath}
        />
      )}
    </div>
  );
};
