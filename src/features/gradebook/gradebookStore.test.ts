import { describe, it, expect, beforeEach } from 'vitest';
import { useGradebookStore } from './store/useGradebookStore';
import { storage } from '../../core/storage/dexieStorage';

describe('useGradebookStore', () => {
  beforeEach(async () => {
    await storage.clear();
    useGradebookStore.setState({
      data: {
        courses: [],
        students: [],
        grades: [],
        attendance: [],
        observations: [],
        reminders: [],
        selectedCourseId: null,
        selectedStudentId: null,
        activeTab: 'grades',
      },
      isLoading: false,
    });
  });

  it('adds a new course and selects it', async () => {
    const store = useGradebookStore.getState();
    const course = await store.addCourse('1st Grade A', 'Matemáticas, Lenguaje');

    const state = useGradebookStore.getState();
    expect(state.data.courses.length).toBe(1);
    expect(state.data.courses[0].name).toBe('1st Grade A');
    expect(state.data.courses[0].subjects).toEqual(['Matemáticas', 'Lenguaje']);
    expect(state.data.selectedCourseId).toBe(course.id);
  });

  it('adds individual and bulk students to course', async () => {
    const store = useGradebookStore.getState();
    const course = await store.addCourse('2nd Grade', 'Ciencias');

    const student = await store.addStudent('Bastián Cortés', course.id);
    let state = useGradebookStore.getState();
    expect(state.data.students.length).toBe(1);
    expect(state.data.students[0].name).toBe('Bastián Cortés');

    await store.addStudentsBulk(['Andrea Valenzuela', 'Carlos Díaz'], course.id);
    state = useGradebookStore.getState();
    expect(state.data.students.length).toBe(3);
    // Students should be sorted alphabetically
    expect(state.data.students[0].name).toBe('Andrea Valenzuela');
  });

  it('cascades deletion of a student to associated grades, attendance, and reminders', async () => {
    const store = useGradebookStore.getState();
    const course = await store.addCourse('3rd Grade', 'Historia');
    const student = await store.addStudent('Diego Palma', course.id);

    await store.setGrade(student.id, 'Historia', 10, 6.8, 'Control 1');
    await store.setAttendance(student.id, '2026-05-10', 'present');
    await store.setStudentObservation(student.id, 'Excelente participación');
    await store.addStudentReminder(student.id, 'Entregar autorización');

    let state = useGradebookStore.getState();
    expect(state.data.grades.length).toBe(1);
    expect(state.data.attendance.length).toBe(1);
    expect(state.data.observations.length).toBe(1);
    expect(state.data.reminders.length).toBe(1);

    await store.deleteStudent(student.id);
    state = useGradebookStore.getState();
    expect(state.data.students.length).toBe(0);
    expect(state.data.grades.length).toBe(0);
    expect(state.data.attendance.length).toBe(0);
    expect(state.data.observations.length).toBe(0);
    expect(state.data.reminders.length).toBe(0);
  });

  it('cascades deletion of a course to its students and all associated records', async () => {
    const store = useGradebookStore.getState();
    const course = await store.addCourse('4th Grade', 'Arte');
    const student = await store.addStudent('Elena Gómez', course.id);
    await store.setGrade(student.id, 'Arte', 10, 7.0, 'Pintura');

    let state = useGradebookStore.getState();
    expect(state.data.courses.length).toBe(1);
    expect(state.data.students.length).toBe(1);

    await store.deleteCourse(course.id);
    state = useGradebookStore.getState();
    expect(state.data.courses.length).toBe(0);
    expect(state.data.students.length).toBe(0);
    expect(state.data.grades.length).toBe(0);
  });

  it('manages evaluation columns and cascades grade deletion', async () => {
    const store = useGradebookStore.getState();
    const course = await store.addCourse('5th Grade', 'Música');
    const student = await store.addStudent('Fabián Soto', course.id);

    await store.addEvaluationColumn(course.id, 'Música', 1, 'Audición 1');
    await store.setGrade(student.id, 'Música', 1, 6.5, 'Audición 1');

    let state = useGradebookStore.getState();
    expect(state.data.courses[0].evaluations?.length).toBe(1);
    expect(state.data.grades.length).toBe(1);

    await store.deleteEvaluationColumn(course.id, 'Música', 'Audición 1');
    state = useGradebookStore.getState();
    expect(state.data.courses[0].evaluations?.length).toBe(0);
    expect(state.data.grades.length).toBe(0);
  });
});
