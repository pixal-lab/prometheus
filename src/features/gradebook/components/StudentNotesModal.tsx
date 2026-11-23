import React, { useState } from 'react';
import { Student, StudentObservation, StudentReminder } from '../../../core/types/gradebook.types';
import { useGradebookStore } from '../store/useGradebookStore';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, StickyNote, Bell } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface StudentNotesProps {
  students: Student[];
  observations: StudentObservation[];
  reminders: StudentReminder[];
}

export const StudentNotesView: React.FC<StudentNotesProps> = ({
  students,
  observations,
  reminders,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { setStudentObservation, addStudentReminder, deleteStudentReminder } = useGradebookStore();

  const [selectedStudentId, setSelectedStudentId] = useState<number>(students[0]?.id || 0);
  const [newReminderText, setNewReminderText] = useState('');

  const currentStudent = students.find(s => s.id === selectedStudentId);
  const studentObs = observations.find(o => o.studentId === selectedStudentId);
  const studentReminders = reminders.filter(r => r.studentId === selectedStudentId);

  const [obsText, setObsText] = useState(studentObs?.text || '');

  React.useEffect(() => {
    const obs = observations.find(o => o.studentId === selectedStudentId);
    setObsText(obs?.text || '');
  }, [selectedStudentId, observations]);

  const handleSaveObs = async () => {
    if (!selectedStudentId) return;
    await setStudentObservation(selectedStudentId, obsText);
    showToast('Observación guardada', 'success');
  };

  const handleAddReminder = async () => {
    if (!newReminderText.trim() || !selectedStudentId) return;
    await addStudentReminder(selectedStudentId, newReminderText.trim());
    setNewReminderText('');
    showToast('Recordatorio añadido', 'info');
  };

  if (students.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        No hay estudiantes para registrar observaciones.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Student List Column */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-2 max-h-[500px] overflow-y-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          {t('students_sidebar')}
        </span>
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStudentId(s.id)}
            className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold text-left transition-colors cursor-pointer ${
              selectedStudentId === s.id
                ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <span>{s.name}</span>
          </button>
        ))}
      </div>

      {/* Detail Column */}
      <div className="md:col-span-2 flex flex-col gap-6">
        {/* Observations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <StickyNote size={17} className="text-amber-500" /> {t('observations')}: {currentStudent?.name}
            </h3>
            <Button onClick={handleSaveObs} variant="primary" size="sm">
              {t('save_obs_btn')}
            </Button>
          </div>
          <textarea
            rows={4}
            value={obsText}
            onChange={e => setObsText(e.target.value)}
            placeholder={t('obs_ph')}
            className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Reminders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell size={17} className="text-blue-500" /> {t('reminders_alerts')}
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newReminderText}
              onChange={e => setNewReminderText(e.target.value)}
              placeholder={t('add_reminder_ph')}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              onKeyDown={e => e.key === 'Enter' && handleAddReminder()}
            />
            <Button onClick={handleAddReminder} variant="outline" size="sm">
              <Plus size={14} /> {t('add')}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {studentReminders.map(rem => (
              <div
                key={rem.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
              >
                <span className="text-slate-800 dark:text-slate-200">{rem.text}</span>
                <button
                  onClick={() => deleteStudentReminder(rem.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Eliminar recordatorio"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {studentReminders.length === 0 && (
              <span className="text-xs text-slate-400 italic">{t('no_reminders')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

