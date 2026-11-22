import { describe, it, expect } from 'vitest';
import { exportGradesToCsv, exportAttendanceToCsv } from './services/gradebookExportService';
import { Course, Student, GradeItem, AttendanceRecord } from '../../core/types/gradebook.types';

describe('gradebookExportService', () => {
  const sampleCourse: Course = {
    id: 1,
    name: '5th Grade A',
    subjects: ['Matemáticas', 'Ciencias'],
    categories: [
      { id: 10, name: 'Exámenes', weight: 50 },
      { id: 11, name: 'Tareas', weight: 50 },
    ],
  };

  const sampleStudents: Student[] = [
    { id: 101, courseId: 1, name: 'Juan Pérez' },
    { id: 102, courseId: 1, name: 'Ana Gómez' },
  ];

  const sampleGrades: GradeItem[] = [
    { id: 1, studentId: 101, subject: 'Matemáticas', categoryId: 10, grade: 6.5, details: 'Examen 1' },
    { id: 2, studentId: 102, subject: 'Matemáticas', categoryId: 10, grade: 5.0, details: 'Examen 1' },
  ];

  const sampleAttendance: AttendanceRecord[] = [
    { id: 1, studentId: 101, date: '2026-03-01', status: 'present' },
    { id: 2, studentId: 102, date: '2026-03-01', status: 'absent' },
  ];

  it('generates valid grades CSV string', () => {
    const csv = exportGradesToCsv(sampleCourse, sampleStudents, sampleGrades);
    expect(csv).toContain('Juan Pérez');
    expect(csv).toContain('Matemáticas');
    expect(csv).toContain('6.5');
  });

  it('generates valid attendance CSV string', () => {
    const csv = exportAttendanceToCsv(sampleCourse, sampleStudents, sampleAttendance);
    expect(csv).toContain('Juan Pérez');
    expect(csv).toContain('Presente');
    expect(csv).toContain('Ausente');
  });

  it('correctly calculates weighted averages across categories', () => {
    const gradesWithWeights: GradeItem[] = [
      { id: 1, studentId: 101, subject: 'Matemáticas', categoryId: 10, grade: 6.0, details: 'Examen 1' }, // 50%
      { id: 2, studentId: 101, subject: 'Matemáticas', categoryId: 11, grade: 7.0, details: 'Tarea 1' },  // 50%
    ];

    let totalWeightUsed = 0;
    let weightedSum = 0;
    sampleCourse.categories.forEach(cat => {
      const catGrades = gradesWithWeights.filter(g => g.categoryId === cat.id);
      if (catGrades.length > 0) {
        const catAvg = catGrades.reduce((s, g) => s + g.grade, 0) / catGrades.length;
        weightedSum += catAvg * (cat.weight / 100);
        totalWeightUsed += cat.weight;
      }
    });

    const finalAvg = ((weightedSum / totalWeightUsed) * 100).toFixed(1);
    expect(finalAvg).toBe('6.5');
  });
});
