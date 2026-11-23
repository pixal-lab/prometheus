import { describe, it, expect, beforeEach } from 'vitest';
import { useLessonPlannerStore } from './store/useLessonPlannerStore';
import { storage } from '../../core/storage/dexieStorage';

describe('useLessonPlannerStore', () => {
  beforeEach(async () => {
    await storage.clear();
    useLessonPlannerStore.setState({
      data: {},
      activeLessonId: null,
      activeLessonPath: [],
      templates: [],
      searchQuery: '',
      isLoading: false,
    });
  });

  it('creates folders hierarchically (course -> subject -> unit)', async () => {
    const store = useLessonPlannerStore.getState();

    // 1. Root folder (course)
    await store.createFolder([], '6th Grade');
    let state = useLessonPlannerStore.getState();
    expect(state.data['6th Grade']).toBeDefined();
    const course = state.data['6th Grade'] as any;
    expect(course.name).toBe('6th Grade');
    expect(course.type).toBe('course');

    // 2. Child folder (subject)
    await store.createFolder(['6th Grade'], 'Ciencias');
    state = useLessonPlannerStore.getState();
    const courseWithSubject = state.data['6th Grade'] as any;
    expect(courseWithSubject.children['Ciencias']).toBeDefined();
    expect(courseWithSubject.children['Ciencias'].name).toBe('Ciencias');

    // 3. Grandchild folder (unit)
    await store.createFolder(['6th Grade', 'Ciencias'], 'Unidad 1 - El Universo');
    state = useLessonPlannerStore.getState();
    const updatedCourse = state.data['6th Grade'] as any;
    const subject = updatedCourse?.children?.['Ciencias'];
    expect(subject?.children?.['Unidad 1 - El Universo']).toBeDefined();
  });

  it('creates a lesson inside a unit and sets activeLessonPath', async () => {
    const store = useLessonPlannerStore.getState();
    await store.createFolder([], '7th Grade');
    await store.createFolder(['7th Grade'], 'Historia');

    const lessonId = await store.createLesson(['7th Grade', 'Historia'], 'Lección 1: Edad Media', undefined, {
      objectives: 'Conocer el feudalismo',
    });

    const state = useLessonPlannerStore.getState();
    expect(state.activeLessonId).toBe(lessonId);
    expect(state.activeLessonPath).toEqual(['7th Grade', 'Historia', 'Lección 1: Edad Media']);

    const folder = state.data['7th Grade'];
    if ('children' in folder) {
      const subject = folder.children['Historia'];
      if ('children' in subject) {
        const lessonNode = subject.children['Lección 1: Edad Media'];
        expect(lessonNode).toBeDefined();
        if ('content' in lessonNode) {
          expect(lessonNode.content.objectives).toBe('Conocer el feudalismo');
        }
      }
    }
  });

  it('updates lesson content and updates title when key changes', async () => {
    const store = useLessonPlannerStore.getState();
    await store.createFolder([], '4th Grade');
    const lessonId = await store.createLesson(['4th Grade'], 'L1 Original', undefined, {
      objectives: 'Obj 1',
    });

    await store.updateLessonContent(['4th Grade', 'L1 Original'], 'L1 Renombrada', {
      objectives: 'Obj Actualizado',
      readings: 'Capítulo 3',
      warmUp: '10 min',
      presentation: '20 min',
      guidedPractice: '15 min',
      independentPractice: '15 min',
      closure: 'Ticket',
      accommodations: 'DUA 1',
    });

    const state = useLessonPlannerStore.getState();
    expect(state.activeLessonPath).toEqual(['4th Grade', 'L1 Renombrada']);

    const folder = state.data['4th Grade'];
    if ('children' in folder) {
      expect(folder.children['L1 Original']).toBeUndefined();
      const updated = folder.children['L1 Renombrada'];
      expect(updated).toBeDefined();
      if ('content' in updated) {
        expect(updated.content.objectives).toBe('Obj Actualizado');
        expect(updated.content.readings).toBe('Capítulo 3');
      }
    }
  });

  it('updates activeLessonPath when an ancestor folder is renamed', async () => {
    const store = useLessonPlannerStore.getState();
    await store.createFolder([], 'Curso Antiguo');
    await store.createFolder(['Curso Antiguo'], 'Materia');
    await store.createLesson(['Curso Antiguo', 'Materia'], 'Lección Alpha');

    let state = useLessonPlannerStore.getState();
    expect(state.activeLessonPath).toEqual(['Curso Antiguo', 'Materia', 'Lección Alpha']);

    // Rename ancestor folder
    await store.renameNode(['Curso Antiguo'], 'Curso Nuevo');
    state = useLessonPlannerStore.getState();
    expect(state.data['Curso Antiguo']).toBeUndefined();
    expect(state.data['Curso Nuevo']).toBeDefined();

    // The active path should reflect the renamed ancestor
    expect(state.activeLessonPath).toEqual(['Curso Nuevo', 'Materia', 'Lección Alpha']);
  });

  it('cleans activeLessonPath when active lesson or its parent folder is deleted', async () => {
    const store = useLessonPlannerStore.getState();
    await store.createFolder([], '8th Grade');
    await store.createLesson(['8th Grade'], 'Lección a Borrar');

    let state = useLessonPlannerStore.getState();
    expect(state.activeLessonId).not.toBeNull();

    // Delete parent folder
    await store.deleteNode(['8th Grade']);
    state = useLessonPlannerStore.getState();
    expect(state.data['8th Grade']).toBeUndefined();
    expect(state.activeLessonId).toBeNull();
    expect(state.activeLessonPath).toEqual([]);
  });

  it('saves and applies lesson templates', async () => {
    const store = useLessonPlannerStore.getState();
    await store.saveAsTemplate('Plantilla de Ciencias', {
      objectives: 'Investigar fenómenos naturales',
      warmUp: 'Pregunta socrática',
    });

    let state = useLessonPlannerStore.getState();
    expect(state.templates.length).toBe(1);
    expect(state.templates[0].name).toBe('Plantilla de Ciencias');

    // Create lesson using template
    await store.createFolder([], 'Ciencias Lab');
    await store.createLesson(['Ciencias Lab'], 'Laboratorio 1', state.templates[0].id);

    state = useLessonPlannerStore.getState();
    const folder = state.data['Ciencias Lab'];
    if ('children' in folder) {
      const lesson = folder.children['Laboratorio 1'];
      if ('content' in lesson) {
        expect(lesson.content.objectives).toBe('Investigar fenómenos naturales');
        expect(lesson.content.warmUp).toBe('Pregunta socrática');
      }
    }
  });
});
