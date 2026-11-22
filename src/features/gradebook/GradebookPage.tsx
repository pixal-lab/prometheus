import React, { useEffect, useState } from 'react';
import { useGradebookStore } from './store/useGradebookStore';
import { StudentDashboard } from './components/StudentDashboard';
import { GradeMatrix } from './components/GradeMatrix';
import { AttendanceSheet } from './components/AttendanceSheet';
import { StudentNotesView } from './components/StudentNotesModal';
import { CsvImportModal } from './components/CsvImportModal';
import { CategoryWeightsModal } from './components/CategoryWeightsModal';
import { AddCourseModal } from './components/AddCourseModal';
import { AddStudentModal } from './components/AddStudentModal';
import { exportGradesToCsv, exportAttendanceToCsv } from './services/gradebookExportService';
import { Button } from '../../components/ui/Button';
import {
  Plus,
  Upload,
  Download,
  SlidersHorizontal,
  Users,
  GraduationCap,
  ClipboardCheck,
  MessageSquare,
  User,
  FileSpreadsheet,
} from 'lucide-react';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useToast } from '../../components/ui/Toast';

export const GradebookPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    data,
    loadData,
    selectCourse,
    setActiveTab,
    isLoading,
  } = useGradebookStore();

  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeCourse = data.courses.find(c => c.id === data.selectedCourseId) || data.courses[0];
  const [activeSubject, setActiveSubject] = useState<string>(activeCourse?.subjects[0] || 'General');

  useEffect(() => {
    if (activeCourse && activeCourse.subjects.length > 0) {
      if (!activeCourse.subjects.includes(activeSubject)) {
        setActiveSubject(activeCourse.subjects[0]);
      }
    }
  }, [activeCourse, activeSubject]);

  const courseStudents = data.students.filter(s => s.courseId === activeCourse?.id);

  const handleExportGrades = () => {
    if (!activeCourse) return;
    exportGradesToCsv(activeCourse, data.students, data.grades);
    showToast('Calificaciones exportadas a CSV', 'success');
  };

  const handleExportAttendance = () => {
    if (!activeCourse) return;
    exportAttendanceToCsv(activeCourse, data.students, data.attendance);
    showToast('Asistencia exportada a CSV', 'success');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-slate-400">Cargando libro de clases...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            📖 {t('gradebook')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión integral de ficha de alumno, calificaciones ponderadas, registro de asistencia y observaciones.
          </p>
        </div>

        {/* Global course actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsAddCourseOpen(true)} variant="outline" size="sm">
            <Plus size={15} /> Crear Curso
          </Button>

          {activeCourse && (
            <>
              <Button onClick={() => setIsWeightsModalOpen(true)} variant="outline" size="sm" title="Ajustes de Ponderación">
                <SlidersHorizontal size={15} /> {t('weighted_categories')}
              </Button>

              <Button onClick={() => setIsCsvModalOpen(true)} variant="outline" size="sm" title="Importar Estudiantes o Calificaciones desde CSV">
                <Upload size={15} /> {t('import_csv')}
              </Button>

              {/* Export dropdown / buttons */}
              <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-white dark:bg-slate-900">
                <button
                  onClick={handleExportGrades}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  title="Exportar Calificaciones del Curso a CSV"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" /> Notas CSV
                </button>
                <button
                  onClick={handleExportAttendance}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  title="Exportar Asistencia del Curso a CSV"
                >
                  <FileSpreadsheet size={15} className="text-blue-600 shrink-0" /> Asistencia CSV
                </button>
              </div>

              <Button onClick={() => setIsAddStudentOpen(true)} variant="primary" size="sm">
                <Plus size={15} /> {t('add_student')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Selectors & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        {/* Course and Subject dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Curso:</span>
            <select
              value={activeCourse?.id || ''}
              onChange={e => selectCourse(Number(e.target.value))}
              className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              {data.courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({data.students.filter(s => s.courseId === c.id).length} alumnos)
                </option>
              ))}
            </select>
          </div>

          {activeCourse && data.activeTab === 'grades' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Asignatura:</span>
              <select
                value={activeSubject}
                onChange={e => setActiveSubject(e.target.value)}
                className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {activeCourse.subjects.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              data.activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <User size={15} /> Ficha Alumno
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              data.activeTab === 'grades'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <GraduationCap size={15} /> {t('grades')}
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              data.activeTab === 'attendance'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <ClipboardCheck size={15} /> {t('attendance')}
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              data.activeTab === 'notes'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <MessageSquare size={15} /> {t('observations')}
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeCourse && (
        <>
          {data.activeTab === 'dashboard' && (
            <StudentDashboard
              course={activeCourse}
              students={courseStudents}
              grades={data.grades}
              attendance={data.attendance}
              observations={data.observations}
              reminders={data.reminders}
            />
          )}

          {data.activeTab === 'grades' && (
            <GradeMatrix
              course={activeCourse}
              students={courseStudents}
              grades={data.grades}
              currentSubject={activeSubject}
            />
          )}

          {data.activeTab === 'attendance' && (
            <AttendanceSheet
              students={courseStudents}
              attendance={data.attendance}
            />
          )}

          {data.activeTab === 'notes' && (
            <StudentNotesView
              students={courseStudents}
              observations={data.observations}
              reminders={data.reminders}
            />
          )}

          <CsvImportModal
            isOpen={isCsvModalOpen}
            onClose={() => setIsCsvModalOpen(false)}
            courseId={activeCourse.id}
          />

          <CategoryWeightsModal
            isOpen={isWeightsModalOpen}
            onClose={() => setIsWeightsModalOpen(false)}
            course={activeCourse}
          />

          <AddCourseModal
            isOpen={isAddCourseOpen}
            onClose={() => setIsAddCourseOpen(false)}
          />

          <AddStudentModal
            isOpen={isAddStudentOpen}
            onClose={() => setIsAddStudentOpen(false)}
            courseId={activeCourse.id}
            courseName={activeCourse.name}
          />
        </>
      )}
    </div>
  );
};
