import React, { useState, useMemo } from 'react';
import { Course, Student, GradeItem, AttendanceRecord, StudentObservation, StudentReminder } from '../../../core/types/gradebook.types';
import { useGradebookStore } from '../store/useGradebookStore';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { Button } from '../../../components/ui/Button';
import {
  User,
  GraduationCap,
  CalendarCheck,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface StudentDashboardProps {
  course: Course;
  students: Student[];
  grades: GradeItem[];
  attendance: AttendanceRecord[];
  observations: StudentObservation[];
  reminders: StudentReminder[];
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  course,
  students,
  grades,
  attendance,
  observations,
  reminders,
}) => {
  const { t } = useTranslation();
  const { setStudentObservation, addStudentReminder, deleteStudentReminder } = useGradebookStore();
  const { showToast } = useToast();

  const [selectedStudentId, setSelectedStudentId] = useState<number>(students[0]?.id || 0);
  const [studentSearch, setStudentSearch] = useState('');
  const [newReminderText, setNewReminderText] = useState('');

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Observation state for the selected student
  const studentObservation = observations.find(o => o.studentId === currentStudent?.id)?.text || '';
  const [obsText, setObsText] = useState(studentObservation);

  // Update observation text when selected student changes
  React.useEffect(() => {
    const obs = observations.find(o => o.studentId === currentStudent?.id)?.text || '';
    setObsText(obs);
  }, [currentStudent?.id, observations]);

  // Filter students for sidebar
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    return students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
  }, [students, studentSearch]);

  // Student grades by subject
  const studentGrades = useMemo(() => {
    if (!currentStudent) return [];
    return grades.filter(g => g.studentId === currentStudent.id);
  }, [grades, currentStudent?.id]);

  // Subject averages (calculates category average first, then weights across categories, identical to GradeMatrix)
  const subjectAverages = useMemo(() => {
    const map: Record<string, { totalWeighted: number; totalWeight: number; grades: GradeItem[]; simpleAvg: number }> = {};
    for (const sub of course.subjects) {
      const subGrades = studentGrades.filter(g => g.subject === sub && g.grade > 0);
      let weightedSum = 0;
      let totalWeightUsed = 0;

      if (course.categories && course.categories.length > 0) {
        course.categories.forEach(cat => {
          const catGrades = subGrades.filter(g => g.categoryId === cat.id);
          if (catGrades.length > 0) {
            const catAvg = catGrades.reduce((s, g) => s + g.grade, 0) / catGrades.length;
            weightedSum += catAvg * (cat.weight / 100);
            totalWeightUsed += cat.weight;
          }
        });
      }

      const totalWeighted = totalWeightUsed > 0 ? (weightedSum / totalWeightUsed) * 100 : 0;
      const simpleAvg = subGrades.length > 0 ? subGrades.reduce((s, g) => s + g.grade, 0) / subGrades.length : 0;

      map[sub] = {
        totalWeighted,
        totalWeight: totalWeightUsed,
        grades: subGrades,
        simpleAvg,
      };
    }
    return map;
  }, [course, studentGrades]);

  // Overall student average
  const overallAverage = useMemo(() => {
    const averages = Object.values(subjectAverages)
      .map(s => (s.totalWeight > 0 ? s.totalWeighted : s.simpleAvg))
      .filter(avg => avg > 0);
    if (averages.length === 0) return 0;
    return averages.reduce((a, b) => a + b, 0) / averages.length;
  }, [subjectAverages]);

  // Attendance stats for student (excused absences are excluded from countable total)
  const studentAttendance = useMemo(() => {
    if (!currentStudent) return { present: 0, absent: 0, late: 0, excused: 0, total: 0, rate: 0 };
    const recs = attendance.filter(a => a.studentId === currentStudent.id);
    const present = recs.filter(a => a.status === 'present').length;
    const absent = recs.filter(a => a.status === 'absent').length;
    const late = recs.filter(a => a.status === 'late').length;
    const excused = recs.filter(a => a.status === 'excused').length;
    const total = recs.length;
    const effectiveTotal = total - excused;
    const rate = effectiveTotal > 0 ? Math.round(((present + late * 0.5) / effectiveTotal) * 100) : (total > 0 ? 100 : 100);
    return { present, absent, late, excused, total, rate };
  }, [attendance, currentStudent?.id]);

  // Reminders for current student
  const studentReminders = useMemo(() => {
    if (!currentStudent) return [];
    return reminders.filter(r => r.studentId === currentStudent.id);
  }, [reminders, currentStudent?.id]);

  const handleSaveObservation = async () => {
    if (!currentStudent) return;
    await setStudentObservation(currentStudent.id, obsText);
    showToast('Observación guardada con éxito', 'success');
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !newReminderText.trim()) return;
    await addStudentReminder(currentStudent.id, newReminderText.trim());
    setNewReminderText('');
    showToast('Recordatorio añadido', 'info');
  };

  if (!currentStudent) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-sm text-slate-400">No hay estudiantes en este curso. Añade un estudiante para ver su ficha.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none">
      {/* Student List Sidebar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">{t('students_sidebar')} ({students.length})</h3>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('search_student_ph')}
            value={studentSearch}
            onChange={e => setStudentSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-[500px] overflow-y-auto pr-1">
          {filteredStudents.map(student => {
            const isSelected = student.id === currentStudent.id;
            return (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    isSelected ? 'bg-white text-orange-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {student.name.charAt(0)}
                </div>
                <span className="truncate">{student.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Student Profile & Stats */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {currentStudent.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {currentStudent.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {course.name} • ID: #{currentStudent.id}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400">{t('general_average')}</span>
              <span
                className={`text-lg font-bold font-mono ${
                  overallAverage >= 6.0
                    ? 'text-emerald-600'
                    : overallAverage >= 4.0
                    ? 'text-amber-600'
                    : overallAverage > 0
                    ? 'text-red-600'
                    : 'text-slate-400'
                }`}
              >
                {overallAverage > 0 ? overallAverage.toFixed(1) : '-'}
              </span>
            </div>

            <div className="flex flex-col items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400">{t('attendance')}</span>
              <span
                className={`text-lg font-bold font-mono ${
                  studentAttendance.rate >= 85
                    ? 'text-emerald-600'
                    : studentAttendance.rate >= 75
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}
              >
                {studentAttendance.rate}%
              </span>
            </div>
          </div>
        </div>

        {/* Academic Grades Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <GraduationCap size={16} className="text-orange-600" />
            {t('subject_performance')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.subjects.map(sub => {
              const info = subjectAverages[sub];
              const avg = info.totalWeight > 0 ? info.totalWeighted : info.simpleAvg;

              return (
                <div
                  key={sub}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{sub}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                        avg >= 6.0
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : avg >= 4.0
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : avg > 0
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {avg > 0 ? avg.toFixed(1) : t('no_grades_short')}
                    </span>
                  </div>

                  {info.grades.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {info.grades.map(g => (
                        <div
                          key={g.id}
                          className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono flex items-center gap-1 shadow-2xs"
                          title={`${g.details} (${g.grade})`}
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">{g.grade.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[80px]">({g.details})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">{t('no_grades_recorded')}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Attendance & Reminders Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <CalendarCheck size={16} className="text-orange-600" />
              {t('attendance_breakdown')}
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 size={14} /> {t('present_plural')}:
                </span>
                <span className="font-bold font-mono text-emerald-800 dark:text-emerald-200">{studentAttendance.present}</span>
              </div>

              <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-semibold">
                  <XCircle size={14} /> {t('absent_plural')}:
                </span>
                <span className="font-bold font-mono text-rose-800 dark:text-rose-200">{studentAttendance.absent}</span>
              </div>

              <div className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
                  <Clock size={14} /> {t('late_plural')}:
                </span>
                <span className="font-bold font-mono text-amber-800 dark:text-amber-200">{studentAttendance.late}</span>
              </div>

              <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-semibold">
                  <HelpCircle size={14} /> {t('excused_plural')}:
                </span>
                <span className="font-bold font-mono text-blue-800 dark:text-blue-200">{studentAttendance.excused}</span>
              </div>
            </div>
          </div>

          {/* Student Reminders */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-600" />
              {t('reminders_alerts')}
            </h3>

            <form onSubmit={handleAddReminder} className="flex gap-2">
              <input
                type="text"
                placeholder={t('add_reminder_ph')}
                value={newReminderText}
                onChange={e => setNewReminderText(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
              <Button type="submit" variant="primary" size="sm">
                <Plus size={14} />
              </Button>
            </form>

            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {studentReminders.length === 0 ? (
                <span className="text-xs text-slate-400 italic py-2">{t('no_reminders')}</span>
              ) : (
                studentReminders.map(r => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-200"
                  >
                    <span>{r.text}</span>
                    <button
                      onClick={() => deleteStudentReminder(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Eliminar recordatorio"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Student Observation Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              {t('student_obs_title')}
            </h3>
            <Button onClick={handleSaveObservation} variant="primary" size="sm">
              <Save size={14} /> {t('save_obs_btn')}
            </Button>
          </div>

          <textarea
            rows={4}
            value={obsText}
            onChange={e => setObsText(e.target.value)}
            placeholder={t('obs_ph')}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
  );
};
