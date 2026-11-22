import { create } from 'zustand';
import { storage } from '../../../core/storage/dexieStorage';
import {
  GradebookData,
  Course,
  Student,
  GradeItem,
  AttendanceRecord,
  AttendanceStatus,
  CategoryWeight,
} from '../../../core/types/gradebook.types';
import { logger } from '../../../core/debug/logger';

interface GradebookStore {
  data: GradebookData;
  isLoading: boolean;

  loadData: () => Promise<void>;
  saveData: () => Promise<void>;

  selectCourse: (courseId: number | null) => void;
  selectStudent: (studentId: number | null) => void;
  setActiveTab: (tab: 'dashboard' | 'grades' | 'attendance' | 'notes') => void;

  addCourse: (name: string, subjectsStr: string) => Promise<Course>;
  updateCourseCategories: (courseId: number, categories: CategoryWeight[]) => Promise<void>;

  addStudent: (name: string, courseId: number) => Promise<Student>;
  addStudentsBulk: (names: string[], courseId: number) => Promise<void>;
  deleteStudent: (studentId: number) => Promise<void>;

  setGrade: (studentId: number, subject: string, categoryId: number, grade: number, details: string) => Promise<void>;
  deleteGrade: (gradeId: number) => Promise<void>;
  addEvaluationColumn: (courseId: number, subject: string, categoryId: number, name: string) => Promise<void>;
  deleteEvaluationColumn: (courseId: number, subject: string, name: string) => Promise<void>;

  setAttendance: (studentId: number, date: string, status: AttendanceStatus) => Promise<void>;
  setStudentObservation: (studentId: number, text: string) => Promise<void>;
  addStudentReminder: (studentId: number, text: string) => Promise<void>;
  deleteStudentReminder: (reminderId: number) => Promise<void>;
}

const initialGradebookData: GradebookData = {
  courses: [
    {
      id: 1,
      name: '5th Grade A',
      subjects: ['Matemáticas', 'Ciencias', 'Historia', 'Lenguaje'],
      categories: [
        { id: 10, name: 'Exámenes', weight: 50 },
        { id: 11, name: 'Tareas / Guías', weight: 30 },
        { id: 12, name: 'Participación', weight: 20 },
      ],
    },
  ],
  students: [
    { id: 101, courseId: 1, name: 'Juan Pérez' },
    { id: 102, courseId: 1, name: 'Ana Gómez' },
    { id: 103, courseId: 1, name: 'Carlos Ruiz' },
    { id: 104, courseId: 1, name: 'Sofía Morales' },
  ],
  grades: [
    { id: 1, studentId: 101, subject: 'Matemáticas', categoryId: 10, grade: 6.5, details: 'Examen Unidad 1' },
    { id: 2, studentId: 101, subject: 'Matemáticas', categoryId: 11, grade: 7.0, details: 'Guía de Fracciones' },
    { id: 3, studentId: 102, subject: 'Matemáticas', categoryId: 10, grade: 5.2, details: 'Examen Unidad 1' },
    { id: 4, studentId: 103, subject: 'Matemáticas', categoryId: 10, grade: 4.8, details: 'Examen Unidad 1' },
  ],
  attendance: [],
  observations: [],
  reminders: [],
  selectedCourseId: 1,
  selectedStudentId: null,
  activeTab: 'grades',
};

export const useGradebookStore = create<GradebookStore>((set, get) => ({
  data: initialGradebookData,
  isLoading: true,

  loadData: async () => {
    try {
      set({ isLoading: true });
      const saved = await storage.getItem<GradebookData>('gradebookData');
      if (saved && saved.courses && saved.courses.length > 0) {
        set({ data: saved, isLoading: false });
      } else {
        set({ data: initialGradebookData, isLoading: false });
        await storage.setItem('gradebookData', initialGradebookData);
      }
    } catch (err) {
      logger.error('Gradebook', 'Error cargando datos de libro de clases', err);
      set({ isLoading: false });
    }
  },

  saveData: async () => {
    try {
      await storage.setItem('gradebookData', get().data);
    } catch (err) {
      logger.error('Gradebook', 'Error guardando datos', err);
    }
  },

  selectCourse: courseId => {
    const data = { ...get().data, selectedCourseId: courseId };
    set({ data });
  },

  selectStudent: studentId => {
    const data = { ...get().data, selectedStudentId: studentId };
    set({ data });
  },

  setActiveTab: tab => {
    const data = { ...get().data, activeTab: tab };
    set({ data });
  },

  addCourse: async (name, subjectsStr) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const newCourse: Course = {
      id: Date.now(),
      name: name.trim(),
      subjects: subjectsStr.split(',').map(s => s.trim()).filter(Boolean),
      categories: [
        { id: Date.now() + 1, name: 'Evaluaciones', weight: 60 },
        { id: Date.now() + 2, name: 'Trabajos Prácticos', weight: 40 },
      ],
    };

    data.courses.push(newCourse);
    data.selectedCourseId = newCourse.id;
    set({ data });
    await get().saveData();
    return newCourse;
  },

  updateCourseCategories: async (courseId, categories) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const course = data.courses.find(c => c.id === courseId);
    if (course) {
      course.categories = categories;
      set({ data });
      await get().saveData();
    }
  },

  addStudent: async (name, courseId) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const newStudent: Student = {
      id: Date.now(),
      courseId,
      name: name.trim(),
    };
    data.students.push(newStudent);
    data.students.sort((a, b) => a.name.localeCompare(b.name));
    set({ data });
    await get().saveData();
    return newStudent;
  },

  addStudentsBulk: async (names, courseId) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    names.forEach((name, idx) => {
      if (name.trim()) {
        data.students.push({
          id: Date.now() + idx,
          courseId,
          name: name.trim(),
        });
      }
    });
    data.students.sort((a, b) => a.name.localeCompare(b.name));
    set({ data });
    await get().saveData();
  },

  deleteStudent: async studentId => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    data.students = data.students.filter(s => s.id !== studentId);
    data.grades = data.grades.filter(g => g.studentId !== studentId);
    data.attendance = data.attendance.filter(a => a.studentId !== studentId);
    set({ data });
    await get().saveData();
  },

  setGrade: async (studentId, subject, categoryId, grade, details) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const existing = data.grades.find(
      g => g.studentId === studentId && g.subject === subject && g.details === details
    );

    if (existing) {
      existing.grade = grade;
      existing.categoryId = categoryId;
    } else {
      data.grades.push({
        id: Date.now(),
        studentId,
        subject,
        categoryId,
        grade,
        details,
      });
    }

    set({ data });
    await get().saveData();
  },

  deleteGrade: async gradeId => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    data.grades = data.grades.filter(g => g.id !== gradeId);
    set({ data });
    await get().saveData();
  },

  addEvaluationColumn: async (courseId, subject, categoryId, name) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const course = data.courses.find(c => c.id === courseId);
    if (!course) return;

    course.evaluations = course.evaluations || [];
    const exists = course.evaluations.some(e => e.subject === subject && e.name === name);
    if (!exists) {
      course.evaluations.push({ name, subject, categoryId });
    }

    set({ data });
    await get().saveData();
  },

  deleteEvaluationColumn: async (courseId, subject, name) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const course = data.courses.find(c => c.id === courseId);
    if (course && course.evaluations) {
      course.evaluations = course.evaluations.filter(e => !(e.subject === subject && e.name === name));
    }

    // Also remove grades associated with this evaluation in this course & subject
    const courseStudentIds = new Set(data.students.filter(s => s.courseId === courseId).map(s => s.id));
    data.grades = data.grades.filter(
      g => !(courseStudentIds.has(g.studentId) && g.subject === subject && g.details === name)
    );

    set({ data });
    await get().saveData();
  },

  setAttendance: async (studentId, date, status) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const existing = data.attendance.find(a => a.studentId === studentId && a.date === date);

    if (existing) {
      existing.status = status;
    } else {
      data.attendance.push({
        id: Date.now(),
        studentId,
        date,
        status,
      });
    }

    set({ data });
    await get().saveData();
  },

  setStudentObservation: async (studentId, text) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    const existing = data.observations.find(o => o.studentId === studentId);
    if (existing) {
      existing.text = text;
    } else {
      data.observations.push({
        id: Date.now(),
        studentId,
        text,
        date: new Date().toISOString().split('T')[0],
      });
    }
    set({ data });
    await get().saveData();
  },

  addStudentReminder: async (studentId, text) => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    data.reminders.push({
      id: Date.now(),
      studentId,
      text: text.trim(),
      date: new Date().toISOString().split('T')[0],
    });
    set({ data });
    await get().saveData();
  },

  deleteStudentReminder: async reminderId => {
    const data = JSON.parse(JSON.stringify(get().data)) as GradebookData;
    data.reminders = data.reminders.filter(r => r.id !== reminderId);
    set({ data });
    await get().saveData();
  },
}));

