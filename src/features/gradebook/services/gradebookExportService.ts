import Papa from 'papaparse';
import { Course, Student, GradeItem, AttendanceRecord } from '../../../core/types/gradebook.types';

export const exportGradesToCsv = (
  course: Course,
  students: Student[],
  grades: GradeItem[]
) => {
  const courseStudents = students.filter(s => s.courseId === course.id);
  const studentMap = new Map<number, string>(courseStudents.map(s => [s.id, s.name]));
  const categoryMap = new Map<number, string>(course.categories.map(c => [c.id, c.name]));

  const rows = grades
    .filter(g => studentMap.has(g.studentId))
    .map(g => ({
      Curso: course.name,
      Estudiante: studentMap.get(g.studentId) || 'Desconocido',
      Asignatura: g.subject,
      Categoría: categoryMap.get(g.categoryId) || 'General',
      Calificación: g.grade,
      Detalle: g.details,
      Fecha: g.date || '',
    }));

  const csv = Papa.unparse(rows);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Calificaciones_${course.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return csv;
};

export const exportAttendanceToCsv = (
  course: Course,
  students: Student[],
  attendance: AttendanceRecord[]
) => {
  const courseStudents = students.filter(s => s.courseId === course.id);
  const studentMap = new Map<number, string>(courseStudents.map(s => [s.id, s.name]));

  const statusMap: Record<string, string> = {
    present: 'Presente',
    absent: 'Ausente',
    late: 'Atraso',
    excused: 'Justificado',
  };

  const rows = attendance
    .filter(a => studentMap.has(a.studentId))
    .map(a => ({
      Curso: course.name,
      Estudiante: studentMap.get(a.studentId) || 'Desconocido',
      Fecha: a.date,
      Estado: statusMap[a.status] || a.status,
    }));

  const csv = Papa.unparse(rows);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Asistencia_${course.name.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return csv;
};
