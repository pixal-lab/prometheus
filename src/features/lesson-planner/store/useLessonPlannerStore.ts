import { create } from 'zustand';
import { storage } from '../../../core/storage/dexieStorage';
import { LessonFolder, LessonItem, LessonPlanContent, LessonPlannerData, LessonTemplate } from '../../../core/types/lesson.types';
import { logger } from '../../../core/debug/logger';

interface LessonPlannerState {
  data: LessonPlannerData;
  activeLessonId: string | null;
  activeLessonPath: string[];
  templates: LessonTemplate[];
  searchQuery: string;
  isLoading: boolean;

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;
  setActiveLesson: (id: string | null, path: string[]) => void;
  setSearchQuery: (query: string) => void;

  createFolder: (parentPath: string[], folderName: string) => Promise<void>;
  createLesson: (parentPath: string[], title: string, templateId?: string, customContent?: Partial<LessonPlanContent>) => Promise<string>;
  createLessonWithStructure: (
    course: string,
    subject: string,
    unit: string,
    lessonTitle: string,
    content: LessonPlanContent,
    templateId?: string
  ) => Promise<string>;
  updateLessonContent: (path: string[], title: string, content: LessonPlanContent) => Promise<void>;
  renameNode: (path: string[], newName: string) => Promise<void>;
  deleteNode: (path: string[]) => Promise<void>;
  saveAsTemplate: (name: string, content: LessonPlanContent) => Promise<void>;
}

const defaultContent: LessonPlanContent = {
  objectives: '',
  readings: '',
  warmUp: '',
  presentation: '',
  guidedPractice: '',
  independentPractice: '',
  closure: '',
  accommodations: '',
};

const initialSampleData: LessonPlannerData = {
  '5th Grade': {
    id: 'f-5th',
    name: '5th Grade',
    type: 'course',
    children: {
      'Matemáticas': {
        id: 'f-math',
        name: 'Matemáticas',
        type: 'subject',
        children: {
          'Unidad 1 - Fracciones': {
            id: 'f-u1',
            name: 'Unidad 1 - Fracciones',
            type: 'unit',
            children: {
              'Lección 1: Introducción a Fracciones': {
                id: 'l-intro-frac',
                title: 'Lección 1: Introducción a Fracciones',
                date: new Date().toISOString().split('T')[0],
                content: {
                  objectives: 'Comprender el concepto de fracción como parte de un entero.',
                  readings: 'Texto del estudiante, págs. 24-27',
                  warmUp: 'Actividad con figuras geométricas divididas en partes iguales (10 min).',
                  presentation: 'Definición de numerador y denominador con ejemplos visuales (15 min).',
                  guidedPractice: 'Resolución colectiva de los ejercicios 1 al 4 de la página 25 (20 min).',
                  independentPractice: 'Trabajo individual en guía práctica de fracciones equivalentes (30 min).',
                  closure: 'Ticket de salida: dibujar 3/4 de una pizza y explicarlo (15 min).',
                  accommodations: 'Material concreto (bloques de fracciones) para estudiantes DUA.',
                },
              },
            },
          },
        },
      },
    },
  },
};

export const useLessonPlannerStore = create<LessonPlannerState>((set, get) => ({
  data: {},
  activeLessonId: null,
  activeLessonPath: [],
  templates: [],
  searchQuery: '',
  isLoading: true,

  loadData: async () => {
    try {
      set({ isLoading: true });
      const saved = await storage.getItem<LessonPlannerData>('lessonPlannerData');
      const savedTemplates = (await storage.getItem<LessonTemplate[]>('lessonTemplates')) || [];

      if (saved && Object.keys(saved).length > 0) {
        set({ data: saved, templates: savedTemplates, isLoading: false });
      } else {
        set({ data: initialSampleData, templates: savedTemplates, isLoading: false });
        await storage.setItem('lessonPlannerData', initialSampleData);
      }
    } catch (err) {
      logger.error('LessonPlanner', 'Error cargando datos de lecciones', err);
      set({ isLoading: false });
    }
  },

  saveData: async () => {
    try {
      const data = get().data;
      await storage.setItem('lessonPlannerData', data);
      await storage.setItem('lessonTemplates', get().templates);
    } catch (err) {
      logger.error('LessonPlanner', 'Error guardando datos', err);
    }
  },

  setActiveLesson: (id, path) => set({ activeLessonId: id, activeLessonPath: path }),
  setSearchQuery: query => set({ searchQuery: query }),

  createFolder: async (parentPath, folderName) => {
    const data = JSON.parse(JSON.stringify(get().data)) as LessonPlannerData;
    let current: any = data;

    for (const seg of parentPath) {
      if (current.children) current = current.children[seg];
      else if (current[seg]) current = current[seg];
    }

    const target = parentPath.length === 0 ? data : current.children;
    const newFolder: LessonFolder = {
      id: `folder-${Date.now()}`,
      name: folderName.trim(),
      type: parentPath.length === 0 ? 'course' : parentPath.length === 1 ? 'subject' : 'unit',
      children: {},
    };

    target[folderName.trim()] = newFolder;
    set({ data });
    await get().saveData();
  },

  createLesson: async (parentPath, title, templateId, customContent) => {
    const data = JSON.parse(JSON.stringify(get().data)) as LessonPlannerData;
    let current: any = data;

    for (const seg of parentPath) {
      if (current.children) current = current.children[seg];
      else if (current[seg]) current = current[seg];
    }

    const target = parentPath.length === 0 ? data : current.children;
    let initialContent = { ...defaultContent, ...customContent };

    if (templateId) {
      const tpl = get().templates.find(t => t.id === templateId);
      if (tpl?.content) {
        initialContent = { ...initialContent, ...tpl.content };
      }
    }

    const lessonId = `lesson-${Date.now()}`;
    const newLesson: LessonItem = {
      id: lessonId,
      title: title.trim(),
      date: new Date().toISOString().split('T')[0],
      content: initialContent,
      templateId,
    };

    target[title.trim()] = newLesson;
    const newPath = [...parentPath, title.trim()];

    set({ data, activeLessonId: lessonId, activeLessonPath: newPath });
    await get().saveData();
    return lessonId;
  },

  createLessonWithStructure: async (course, subject, unit, lessonTitle, content, templateId) => {
    const data = JSON.parse(JSON.stringify(get().data)) as LessonPlannerData;

    // 1. Ensure course exists at root
    const trimmedCourse = course.trim() || 'General';
    if (!data[trimmedCourse]) {
      data[trimmedCourse] = {
        id: `folder-${Date.now()}-1`,
        name: trimmedCourse,
        type: 'course',
        children: {},
      };
    }
    const courseFolder = data[trimmedCourse] as LessonFolder;

    // 2. Ensure subject exists under course
    const trimmedSubject = subject.trim() || 'General';
    if (!courseFolder.children[trimmedSubject]) {
      courseFolder.children[trimmedSubject] = {
        id: `folder-${Date.now()}-2`,
        name: trimmedSubject,
        type: 'subject',
        children: {},
      };
    }
    const subjectFolder = courseFolder.children[trimmedSubject] as LessonFolder;

    // 3. Ensure unit exists under subject
    const trimmedUnit = unit.trim() || 'Unidad 1';
    if (!subjectFolder.children[trimmedUnit]) {
      subjectFolder.children[trimmedUnit] = {
        id: `folder-${Date.now()}-3`,
        name: trimmedUnit,
        type: 'unit',
        children: {},
      };
    }
    const unitFolder = subjectFolder.children[trimmedUnit] as LessonFolder;

    // 4. Create lesson inside unit
    const lessonId = `lesson-${Date.now()}`;
    const trimmedTitle = lessonTitle.trim() || 'Nueva Lección';
    const newLesson: LessonItem = {
      id: lessonId,
      title: trimmedTitle,
      date: new Date().toISOString().split('T')[0],
      content,
      templateId,
    };

    unitFolder.children[trimmedTitle] = newLesson;
    const newPath = [trimmedCourse, trimmedSubject, trimmedUnit, trimmedTitle];

    set({ data, activeLessonId: lessonId, activeLessonPath: newPath });
    await get().saveData();
    return lessonId;
  },

  updateLessonContent: async (path, title, content) => {
    const data = JSON.parse(JSON.stringify(get().data)) as LessonPlannerData;
    let current: any = data;

    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i];
      if (current.children) current = current.children[seg];
      else if (current[seg]) current = current[seg];
    }

    const oldKey = path[path.length - 1];
    const target = path.length === 1 ? data : current.children;
    const lesson = target[oldKey] as LessonItem;

    if (lesson) {
      lesson.title = title.trim();
      lesson.content = content;
      if (oldKey !== title.trim()) {
        delete target[oldKey];
        target[title.trim()] = lesson;
        const newPath = [...path.slice(0, -1), title.trim()];
        set({ activeLessonPath: newPath });
      }
    }

    set({ data });
    await get().saveData();
  },

  renameNode: async (path, newName) => {
    if (path.length === 0 || !newName.trim()) return;
    const data = JSON.parse(JSON.stringify(get().data)) as LessonPlannerData;
    let current: any = data;

    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i];
      if (current.children) current = current.children[seg];
      else if (current[seg]) current = current[seg];
    }

    const oldKey = path[path.length - 1];
    const target = path.length === 1 ? data : current.children;
    if (target[oldKey] && oldKey !== newName.trim()) {
      const node = target[oldKey];
      node.name = newName.trim();
      if ('title' in node) node.title = newName.trim();
      delete target[oldKey];
      target[newName.trim()] = node;

      if (get().activeLessonPath.join('/') === path.join('/')) {
        set({ activeLessonPath: [...path.slice(0, -1), newName.trim()] });
      }
    }

    set({ data });
    await get().saveData();
  },

  deleteNode: async path => {
    if (path.length === 0) return;
    const data = JSON.parse(JSON.stringify(get().data)) as LessonPlannerData;
    let current: any = data;

    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i];
      if (current.children) current = current.children[seg];
      else if (current[seg]) current = current[seg];
    }

    const oldKey = path[path.length - 1];
    const target = path.length === 1 ? data : current.children;
    delete target[oldKey];

    if (get().activeLessonPath.join('/').startsWith(path.join('/'))) {
      set({ activeLessonId: null, activeLessonPath: [] });
    }

    set({ data });
    await get().saveData();
  },

  saveAsTemplate: async (name, content) => {
    const newTemplate: LessonTemplate = {
      id: `tpl-${Date.now()}`,
      name,
      content,
    };
    const templates = [...get().templates, newTemplate];
    set({ templates });
    await storage.setItem('lessonTemplates', templates);
  },
}));

