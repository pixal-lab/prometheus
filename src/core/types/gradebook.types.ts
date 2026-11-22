export interface CategoryWeight {
  id: number;
  name: string;
  weight: number; // Percentage 0 - 100
}

export interface CourseEvaluation {
  name: string;
  subject: string;
  categoryId: number;
}

export interface Course {
  id: number;
  name: string;
  subjects: string[];
  categories: CategoryWeight[];
  evaluations?: CourseEvaluation[];
}

export interface Student {
  id: number;
  courseId: number;
  name: string;
  email?: string;
}

export interface GradeItem {
  id: number;
  studentId: number;
  subject: string;
  grade: number; // Raw score or scale
  details: string;
  categoryId: number;
  date?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: number;
  studentId: number;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface StudentObservation {
  id: number;
  studentId: number;
  text: string;
  date?: string;
}

export interface StudentReminder {
  id: number;
  studentId: number;
  text: string;
  date?: string;
}

export interface GradebookData {
  courses: Course[];
  students: Student[];
  grades: GradeItem[];
  attendance: AttendanceRecord[];
  observations: StudentObservation[];
  reminders: StudentReminder[];
  selectedCourseId: number | null;
  selectedStudentId: number | null;
  activeTab: 'dashboard' | 'grades' | 'attendance' | 'notes';
}

