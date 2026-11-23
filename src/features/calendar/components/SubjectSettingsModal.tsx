import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useCalendarStore } from '../store/useCalendarStore';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { useDialog } from '../../../components/ui/Dialog';
import { useToast } from '../../../components/ui/Toast';

interface SubjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAY_KEYS = [
  { code: 'L', label: 'L' },
  { code: 'M', label: 'M' },
  { code: 'X', label: 'X' },
  { code: 'J', label: 'J' },
  { code: 'V', label: 'V' },
];

export const SubjectSettingsModal: React.FC<SubjectSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { subjects, setSubject, deleteSubject } = useCalendarStore();
  const { confirm } = useDialog();
  const { showToast } = useToast();

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectColor, setNewSubjectColor] = useState('#3498db');
  const [newSubjectDays, setNewSubjectDays] = useState<string[]>(['L', 'M', 'X', 'J', 'V']);

  const handleToggleNewDay = (code: string) => {
    setNewSubjectDays(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    await setSubject(newSubjectName.trim(), {
      color: newSubjectColor,
      visible: true,
      availableDays: newSubjectDays.length > 0 ? newSubjectDays : ['L', 'M', 'X', 'J', 'V'],
    });
    setNewSubjectName('');
    setNewSubjectDays(['L', 'M', 'X', 'J', 'V']);
  };

  const handleToggleVisible = async (name: string) => {
    const current = subjects[name];
    if (!current) return;
    await setSubject(name, {
      ...current,
      visible: !current.visible,
    });
  };

  const handleColorChange = async (name: string, color: string) => {
    const current = subjects[name];
    if (!current) return;
    await setSubject(name, {
      ...current,
      color,
    });
  };

  const handleToggleDay = async (name: string, code: string) => {
    const current = subjects[name];
    if (!current) return;
    const days = current.availableDays || ['L', 'M', 'X', 'J', 'V'];
    const nextDays = days.includes(code) ? days.filter(d => d !== code) : [...days, code];
    await setSubject(name, {
      ...current,
      availableDays: nextDays,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('subject_mgmt_title')} maxWidth="lg">
      <div className="flex flex-col gap-5">
        {/* Form to add */}
        <form onSubmit={handleAdd} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('add_subject_title')}</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t('course_name_placeholder')}
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="color"
              value={newSubjectColor}
              onChange={e => setNewSubjectColor(e.target.value)}
              className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 p-0.5 shrink-0"
            />
            <Button type="submit" variant="primary" size="sm">
              <Plus size={14} /> {t('add')}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">{t('teaching_days_label')}</span>
            <div className="flex items-center gap-1">
              {WEEKDAY_KEYS.map(d => (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => handleToggleNewDay(d.code)}
                  className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${
                    newSubjectDays.includes(d.code)
                      ? 'bg-orange-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Existing Subjects List */}
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {Object.entries(subjects).map(([name, conf]) => {
            const days = conf.availableDays || ['L', 'M', 'X', 'J', 'V'];
            return (
              <div
                key={name}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="color"
                    value={conf.color}
                    onChange={e => handleColorChange(name, e.target.value)}
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs font-semibold truncate ${
                        conf.visible ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 line-through'
                      }`}
                    >
                      {name}
                    </span>
                    {/* Days selector */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {WEEKDAY_KEYS.map(d => {
                        const isDayActive = days.includes(d.code);
                        return (
                          <button
                            key={d.code}
                            type="button"
                            onClick={() => handleToggleDay(name, d.code)}
                            className={`w-4 h-4 rounded text-[9px] font-bold transition-colors ${
                              isDayActive
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            }`}
                            title={`Alternar ${d.label} para ${name}`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(name)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    title={conf.visible ? 'Ocultar del calendario' : 'Mostrar en el calendario'}
                  >
                    {conf.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: 'Eliminar Asignatura',
                        message: `¿Deseas eliminar la asignatura "${name}"? Se perderá su configuración de color y visibilidad.`,
                        confirmText: 'Eliminar',
                        variant: 'danger',
                        icon: 'trash',
                      });
                      if (confirmed) {
                        deleteSubject(name);
                        showToast(`Asignatura "${name}" eliminada`, 'info');
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

