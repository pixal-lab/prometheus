import React, { useState } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../../../core/types/gradebook.types';
import { useGradebookStore } from '../store/useGradebookStore';
import { Button } from '../../../components/ui/Button';
import { Check, X, Clock, HelpCircle, CheckCheck } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface AttendanceSheetProps {
  students: Student[];
  attendance: AttendanceRecord[];
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ students, attendance }) => {
  const { t } = useTranslation();
  const { setAttendance } = useGradebookStore();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const dateRecords = attendance.filter(a => a.date === date);

  const getStatus = (studentId: number): AttendanceStatus | null => {
    const rec = dateRecords.find(a => a.studentId === studentId);
    return rec ? rec.status : null;
  };

  const handleMarkAllPresent = () => {
    students.forEach(s => {
      setAttendance(s.id, date, 'present');
    });
  };

  const presentCount = dateRecords.filter(a => a.status === 'present').length;
  const absentCount = dateRecords.filter(a => a.status === 'absent').length;
  const lateCount = dateRecords.filter(a => a.status === 'late').length;
  const excusedCount = dateRecords.filter(a => a.status === 'excused').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Date and Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Fecha de Asistencia:
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-1.5 text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleMarkAllPresent} variant="outline" size="sm">
            <CheckCheck size={16} className="text-emerald-600" /> Marcar Todos Presentes
          </Button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 block">Presentes</span>
          <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{presentCount}</span>
        </div>
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-center">
          <span className="text-xs font-semibold text-rose-800 dark:text-rose-200 block">Ausentes</span>
          <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{absentCount}</span>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 block">Atrasos</span>
          <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">{lateCount}</span>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-200 block">Justificados</span>
          <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">{excusedCount}</span>
        </div>
      </div>

      {/* Student List */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-12 text-center">#</th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Estudiante</th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Estado de Asistencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {students.map((student, idx) => {
              const currentStatus = getStatus(student.id);

              return (
                <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-4 text-center font-mono text-xs text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{student.name}</td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                      <button
                        onClick={() => setAttendance(student.id, date, 'present')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        <Check size={12} /> {t('present')}
                      </button>

                      <button
                        onClick={() => setAttendance(student.id, date, 'absent')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        <X size={12} /> {t('absent')}
                      </button>

                      <button
                        onClick={() => setAttendance(student.id, date, 'late')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'late'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        <Clock size={12} /> {t('late')}
                      </button>

                      <button
                        onClick={() => setAttendance(student.id, date, 'excused')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          currentStatus === 'excused'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        <HelpCircle size={12} /> {t('excused')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

