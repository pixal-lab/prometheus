import React, { useState } from 'react';
import { Course, Student, GradeItem } from '../../../core/types/gradebook.types';
import { useGradebookStore } from '../store/useGradebookStore';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Award } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { useToast } from '../../../components/ui/Toast';
import { useDialog } from '../../../components/ui/Dialog';

interface GradeMatrixProps {
  course: Course;
  students: Student[];
  grades: GradeItem[];
  currentSubject: string;
}

export const GradeMatrix: React.FC<GradeMatrixProps> = ({
  course,
  students,
  grades,
  currentSubject,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const { setGrade, deleteGrade, deleteStudent, addEvaluationColumn, deleteEvaluationColumn } = useGradebookStore();

  const [newEvalName, setNewEvalName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number>(course.categories[0]?.id || 0);

  // Distinct evaluations registered in this course & subject
  const subjectGrades = grades.filter(g => g.subject === currentSubject);
  const registeredEvals = (course.evaluations || []).filter(e => e.subject === currentSubject);
  const gradesEvals = Array.from(new Set(subjectGrades.map(g => g.details)));
  const evaluationNames = Array.from(
    new Set([...registeredEvals.map(e => e.name), ...gradesEvals])
  );

  const handleAddEvaluation = async () => {
    if (!newEvalName.trim()) return;
    await addEvaluationColumn(course.id, currentSubject, selectedCatId, newEvalName.trim());
    setNewEvalName('');
    showToast(`Evaluación "${newEvalName.trim()}" añadida`, 'success');
  };

  const handleDeleteEvaluation = async (name: string) => {
    const confirmed = await confirm({
      title: 'Eliminar Evaluación',
      message: `¿Deseas eliminar la evaluación "${name}" y todas las notas asignadas a ella? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar Evaluación',
      variant: 'danger',
      icon: 'trash',
    });
    if (confirmed) {
      await deleteEvaluationColumn(course.id, currentSubject, name);
      showToast(`Evaluación "${name}" eliminada`, 'info');
    }
  };

  const calculateWeightedAverage = (studentId: number): string => {
    const sGrades = subjectGrades.filter(g => g.studentId === studentId && g.grade > 0);
    if (sGrades.length === 0) return '-';

    if (!course.categories || course.categories.length === 0) {
      const avg = sGrades.reduce((sum, g) => sum + g.grade, 0) / sGrades.length;
      return avg.toFixed(1);
    }

    let totalWeightUsed = 0;
    let weightedSum = 0;

    course.categories.forEach(cat => {
      const catGrades = sGrades.filter(g => g.categoryId === cat.id);
      if (catGrades.length > 0) {
        const catAvg = catGrades.reduce((s, g) => s + g.grade, 0) / catGrades.length;
        weightedSum += catAvg * (cat.weight / 100);
        totalWeightUsed += cat.weight;
      }
    });

    if (totalWeightUsed === 0) return '-';
    const finalAvg = (weightedSum / totalWeightUsed) * 100;
    return finalAvg.toFixed(1);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Add evaluation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={t('new_eval_ph')}
            value={newEvalName}
            onChange={e => setNewEvalName(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
          />
          <select
            value={selectedCatId}
            onChange={e => setSelectedCatId(Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            {course.categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.weight}%)
              </option>
            ))}
          </select>
          <Button onClick={handleAddEvaluation} variant="primary" size="sm">
            <Plus size={14} /> {t('add_column_btn')}
          </Button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {t('active_subject_label')} <strong className="text-orange-600 dark:text-orange-400">{currentSubject}</strong>
        </span>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-12 text-center">
                #
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 min-w-[180px] sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                {t('students')}
              </th>

              {evaluationNames.map(name => {
                const registered = (course.evaluations || []).find(
                  e => e.subject === currentSubject && e.name === name
                );
                const sample = subjectGrades.find(g => g.details === name);
                const catId = registered?.categoryId ?? sample?.categoryId;
                const cat = course.categories.find(c => c.id === catId);

                return (
                  <th key={name} className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 min-w-[120px] text-center group">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <span className="truncate">{name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvaluation(name)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity cursor-pointer"
                          title={`Eliminar evaluación "${name}"`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {cat && (
                        <span className="text-[10px] font-normal text-slate-400">
                          {cat.name} ({cat.weight}%)
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}

              <th className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400 text-center min-w-[100px]">
                {t('average')}
              </th>
              <th className="py-3 px-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {students.map((student, idx) => {
              const avg = calculateWeightedAverage(student.id);
              const isPassing = avg !== '-' && parseFloat(avg) >= 4.0;

              return (
                <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 text-center font-mono text-xs text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-850 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {student.name}
                  </td>

                  {evaluationNames.map(name => {
                    const registered = (course.evaluations || []).find(
                      e => e.subject === currentSubject && e.name === name
                    );
                    const gradeRecord = subjectGrades.find(
                      g => g.studentId === student.id && g.details === name
                    );
                    const val = gradeRecord && gradeRecord.grade > 0 ? gradeRecord.grade : '';

                    return (
                      <td key={name} className="py-2 px-3 text-center">
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="7"
                          value={val}
                          onChange={e => {
                            const raw = e.target.value.trim();
                            if (!raw || raw === '0') {
                              if (gradeRecord) {
                                deleteGrade(gradeRecord.id);
                              }
                              return;
                            }
                            const num = parseFloat(raw);
                            if (!isNaN(num)) {
                              const catId = gradeRecord?.categoryId || registered?.categoryId || selectedCatId;
                              setGrade(student.id, currentSubject, catId, num, name);
                            }
                          }}
                          placeholder="-"
                          className={`w-16 py-1 px-2 text-center text-sm font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors ${val && Number(val) >= 4.0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : val && Number(val) < 4.0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-400'
                            }`}
                        />
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-block font-mono font-bold text-base px-2.5 py-0.5 rounded-lg ${avg === '-'
                          ? 'text-slate-400'
                          : isPassing
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                        }`}
                    >
                      {avg}
                    </span>
                  </td>

                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Eliminar Estudiante',
                          message: `¿Deseas eliminar al alumno "${student.name}" del curso? Todas sus calificaciones registradas se eliminarán.`,
                          confirmText: 'Eliminar Estudiante',
                          variant: 'danger',
                          icon: 'trash',
                        });
                        if (confirmed) {
                          deleteStudent(student.id);
                          showToast(`Estudiante "${student.name}" eliminado`, 'info');
                        }
                      }}
                      className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                      title="Eliminar Estudiante"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {students.length === 0 && (
              <tr>
                <td colSpan={evaluationNames.length + 4} className="py-12 text-center text-slate-400">
                  No hay estudiantes registrados en este curso. Usa el botón "Añadir Estudiante" o "Importar CSV".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

