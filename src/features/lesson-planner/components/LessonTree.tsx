import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Plus, Trash2, Edit2, FolderPlus } from 'lucide-react';
import { LessonFolder, LessonItem, LessonTreeNode } from '../../../core/types/lesson.types';
import { useLessonPlannerStore } from '../store/useLessonPlannerStore';

interface TreeNodeProps {
  name: string;
  node: LessonTreeNode;
  path: string[];
  filter: string;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ name, node, path, filter }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { activeLessonPath, setActiveLesson, createFolder, createLesson, deleteNode, renameNode } = useLessonPlannerStore();
  const isFolder = 'children' in node;
  const isSelected = !isFolder && activeLessonPath.join('/') === path.join('/');

  const matchesFilter = (item: LessonTreeNode, q: string): boolean => {
    if (!q) return true;
    if ('title' in item) {
      return item.title.toLowerCase().includes(q.toLowerCase()) ||
        Object.values(item.content).some(val => val.toLowerCase().includes(q.toLowerCase()));
    }
    if ('children' in item) {
      return Object.entries(item.children).some(([k, child]) =>
        k.toLowerCase().includes(q.toLowerCase()) || matchesFilter(child, q)
      );
    }
    return false;
  };

  if (filter && !matchesFilter(node, filter)) {
    return null;
  }

  const handleAddFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const folderName = prompt('Nombre de la nueva carpeta / unidad:');
    if (folderName?.trim()) {
      await createFolder(path, folderName);
      setIsExpanded(true);
    }
  };

  const handleAddLesson = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const title = prompt('Título de la nueva lección:');
    if (title?.trim()) {
      await createLesson(path, title);
      setIsExpanded(true);
    }
  };

  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentName = 'title' in node ? node.title : node.name;
    const newName = prompt('Renombrar:', currentName);
    if (newName?.trim() && newName !== currentName) {
      await renameNode(path, newName);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar "${name}" y todo su contenido?`)) {
      await deleteNode(path);
    }
  };

  if (!isFolder) {
    const lesson = node as LessonItem;
    return (
      <div
        onClick={() => setActiveLesson(lesson.id, path)}
        className={`group flex items-center justify-between py-1.5 px-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
          isSelected
            ? 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 font-medium'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <FileText size={16} className="text-orange-500 shrink-0" />
          <span className="truncate">{lesson.title}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button onClick={handleRename} className="p-1 hover:text-slate-900 dark:hover:text-slate-100" title="Renombrar">
            <Edit2 size={13} />
          </button>
          <button onClick={handleDelete} className="p-1 hover:text-rose-600 transition-colors" title="Eliminar">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }

  const folder = node as LessonFolder;
  return (
    <div className="flex flex-col">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center justify-between py-1.5 px-2 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-1.5 truncate">
          {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <Folder size={16} className="text-amber-500 fill-amber-500/20 shrink-0" />
          <span className="truncate">{folder.name}</span>
        </div>

        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={handleAddLesson} className="p-1 text-slate-500 hover:text-orange-600" title="Añadir Lección">
            <Plus size={14} />
          </button>
          <button onClick={handleAddFolder} className="p-1 text-slate-500 hover:text-amber-600" title="Añadir Subcarpeta">
            <FolderPlus size={14} />
          </button>
          <button onClick={handleRename} className="p-1 text-slate-500 hover:text-slate-900" title="Renombrar">
            <Edit2 size={13} />
          </button>
          <button onClick={handleDelete} className="p-1 text-slate-500 hover:text-rose-600" title="Eliminar">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {isExpanded && folder.children && (
        <div className="pl-4 ml-2 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-0.5 mt-0.5">
          {Object.entries(folder.children).map(([childKey, childNode]) => (
            <TreeNode
              key={childKey}
              name={childKey}
              node={childNode}
              path={[...path, childKey]}
              filter={filter}
            />
          ))}
          {Object.keys(folder.children).length === 0 && (
            <span className="text-xs text-slate-400 italic py-1 px-2">Carpeta vacía</span>
          )}
        </div>
      )}
    </div>
  );
};

