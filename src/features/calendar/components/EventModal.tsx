import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { ClassBlock, RecurrenceRule } from '../../../core/types/calendar.types';
import { useCalendarStore } from '../store/useCalendarStore';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { useDialog } from '../../../components/ui/Dialog';
import { useToast } from '../../../components/ui/Toast';
import { Trash2, Copy, Calendar, Award, RefreshCw, BookOpen, X, ChevronDown, ChevronUp } from 'lucide-react';
import { LessonPlanPickerModal } from './LessonPlanPickerModal';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ClassBlock | null;
  defaultDate?: string;
}

const WEEKDAYS_RECURRENCE = [
  { day: 1, label: 'L' },
  { day: 2, label: 'M' },
  { day: 3, label: 'X' },
  { day: 4, label: 'J' },
  { day: 5, label: 'V' },
];

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  defaultDate,
}) => {
  const { t } = useTranslation();
  const { subjects, addBlock, updateBlock, deleteBlock, duplicateBlock } = useCalendarStore();
  const { confirm } = useDialog();
  const { showToast } = useToast();

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [color, setColor] = useState('#1abc9c');
  const [evaluation, setEvaluation] = useState(false);
  const [evaluationDetails, setEvaluationDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>({
    type: 'weekly',
    ends: 'afterOccurrences',
    occurrences: 5,
    days: [1],
  });

  // Lesson Plan linking
  const [lessonPlanId, setLessonPlanId] = useState<string | null>(null);
  const [linkedLessonTitle, setLinkedLessonTitle] = useState<string>('');
  const [lessonPlanContent, setLessonPlanContent] = useState<any>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [editRecurringScope, setEditRecurringScope] = useState<'single' | 'series'>('single');

  const isRecurringInstance = !!event?.id.includes('-rec-');
  const subjectNames = Object.keys(subjects);

  useEffect(() => {
    if (event) {
      setSubject(event.subject);
      setTopic(event.topic);
      setDate(event.date);
      setColor(event.color || subjects[event.subject]?.color || '#1abc9c');
      setEvaluation(!!event.evaluation);
      setEvaluationDetails(event.evaluationDetails || '');
      setNotes(event.notes || '');
      setIsRecurring(!!event.isRecurring);
      if (event.recurrenceRule) setRecurrenceRule(event.recurrenceRule);
      setLessonPlanId(event.lessonPlanId || null);
      setLessonPlanContent(event.lessonPlan || null);
      setLinkedLessonTitle(event.lessonPlan?.title || (event.lessonPlanId ? 'Plan de lección vinculado' : ''));
    } else {
      const defaultSub = subjectNames[0] || 'Matemáticas';
      setSubject(defaultSub);
      setTopic('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setColor(subjects[defaultSub]?.color || '#1abc9c');
      setEvaluation(false);
      setEvaluationDetails('');
      setNotes('');
      setIsRecurring(false);
      setLessonPlanId(null);
      setLessonPlanContent(null);
      setLinkedLessonTitle('');
    }
  }, [event, defaultDate, isOpen]);

  const handleSubjectChange = (newSub: string) => {
    setSubject(newSub);
    if (subjects[newSub]?.color) {
      setColor(subjects[newSub].color);
    }
  };

  const handleSelectLessonPlan = (plan: { id: string; title: string; content?: any }) => {
    setLessonPlanId(plan.id);
    setLinkedLessonTitle(plan.title);
    setLessonPlanContent(plan.content || {});
    setShowPlanEditor(true);
  };

  const handleUnlinkLessonPlan = () => {
    setLessonPlanId(null);
    setLinkedLessonTitle('');
    setLessonPlanContent(null);
    setShowPlanEditor(false);
  };

  const handleToggleRecurrenceDay = (dayNum: number) => {
    const currentDays = recurrenceRule.days || [];
    const nextDays = currentDays.includes(dayNum)
      ? currentDays.filter(d => d !== dayNum)
      : [...currentDays, dayNum];
    setRecurrenceRule({ ...recurrenceRule, days: nextDays });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) return;

    const blockData = {
      subject,
      topic,
      date,
      color,
      evaluation,
      evaluationDetails: evaluation ? evaluationDetails : '',
      notes,
      lessonPlanId,
      lessonPlan: lessonPlanContent,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
    };

    if (event) {
      if (isRecurringInstance) {
        const baseId = event.id.replace(/-rec-\d+$/, '');
        if (editRecurringScope === 'single') {
          // Guardar solo esta ocurrencia como una clase independiente
          await addBlock({
            ...blockData,
            isRecurring: false,
            recurrenceRule: undefined,
          });
        } else {
          // Modificar la serie recurrente completa
          await updateBlock(baseId, blockData);
        }
      } else {
        await updateBlock(event.id, blockData);
      }
    } else {
      await addBlock(blockData);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!event) return;
    if (isRecurringInstance) {
      const baseId = event.id.replace(/-rec-\d+$/, '');
      const confirmed = await confirm({
        title: 'Eliminar Serie Recurrente',
        message: 'Esta clase forma parte de una repetición. ¿Deseas eliminar la serie completa de clases?',
        confirmText: 'Eliminar Serie',
        variant: 'danger',
        icon: 'trash',
      });
      if (confirmed) {
        await deleteBlock(baseId);
        showToast('Serie de clases eliminada', 'info');
        onClose();
      }
    } else {
      const confirmed = await confirm({
        title: 'Eliminar Clase',
        message: `¿Deseas eliminar la clase de "${topic || event.subject}"?`,
        confirmText: 'Eliminar',
        variant: 'danger',
        icon: 'trash',
      });
      if (confirmed) {
        await deleteBlock(event.id);
        showToast('Clase eliminada', 'info');
        onClose();
      }
    }
  };

  const handleDuplicate = async () => {
    if (!event) return;
    await duplicateBlock(event.id);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={event ? 'Editar Clase / Evento' : t('create_event')}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRecurringInstance && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs flex flex-col gap-2">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Esta clase es una ocurrencia de una serie repetida.
              </span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="recurringScope"
                    value="single"
                    checked={editRecurringScope === 'single'}
                    onChange={() => setEditRecurringScope('single')}
                  />
                  <span>Solo esta fecha (crear clase individual)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="recurringScope"
                    value="series"
                    checked={editRecurringScope === 'series'}
                    onChange={() => setEditRecurringScope('series')}
                  />
                  <span>Toda la serie recurrente</span>
                </label>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t('event_course')}
              value={subject}
              onChange={e => handleSubjectChange(e.target.value)}
              options={subjectNames.map(s => ({ value: s, label: s }))}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900"
                />
                <span className="text-xs font-mono text-slate-500">{color}</span>
              </div>
            </div>
          </div>

          <Input
            label={t('event_title')}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Ej: Ecuaciones de primer grado"
            required
          />

          <Input
            label={t('event_date')}
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />

          {/* Lesson Plan Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BookOpen size={15} className="text-blue-500" /> Plan de Lección
              </span>
              {!lessonPlanId ? (
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline"
                >
                  + Vincular Plan de Lección
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPlanEditor(prev => !prev)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  {showPlanEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{showPlanEditor ? 'Ocultar detalles' : 'Ver / Editar detalles'}</span>
                </button>
              )}
            </div>

            {lessonPlanId && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs">
                <span className="font-semibold text-blue-900 dark:text-blue-200 truncate">
                  {linkedLessonTitle}
                </span>
                <button
                  type="button"
                  onClick={handleUnlinkLessonPlan}
                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded text-blue-700 dark:text-blue-300"
                  title="Desvincular plan"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Inline Lesson Plan Content Preview / Editor */}
            {lessonPlanId && showPlanEditor && lessonPlanContent && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Objetivos:</span>
                  <textarea
                    rows={2}
                    value={lessonPlanContent.objectives || ''}
                    onChange={e =>
                      setLessonPlanContent({ ...lessonPlanContent, objectives: e.target.value })
                    }
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="Objetivos de aprendizaje..."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Actividades / Desarrollo:</span>
                  <textarea
                    rows={3}
                    value={lessonPlanContent.activities || lessonPlanContent.presentation || ''}
                    onChange={e =>
                      setLessonPlanContent({ ...lessonPlanContent, activities: e.target.value })
                    }
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="Secuencia didáctica de la clase..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Evaluation section */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={evaluation}
                onChange={e => setEvaluation(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
              <Award size={15} className="text-orange-500" />
              <span>{t('include_evaluation')}</span>
            </label>

            {evaluation && (
              <textarea
                rows={2}
                value={evaluationDetails}
                onChange={e => setEvaluationDetails(e.target.value)}
                placeholder="Rúbrica, puntaje, formato de evaluación (formativa o sumativa)..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
              />
            )}
          </div>

          {/* Advanced Recurring section */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
              />
              <RefreshCw size={15} className="text-blue-500" />
              <span>{t('recurring_event')}</span>
            </label>

            {isRecurring && (
              <div className="flex flex-col gap-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Frecuencia"
                    value={recurrenceRule.type}
                    onChange={e => setRecurrenceRule({ ...recurrenceRule, type: e.target.value as any })}
                    options={[
                      { value: 'daily', label: 'Diario' },
                      { value: 'weekly', label: 'Semanal' },
                      { value: 'monthly', label: 'Mensual' },
                      { value: 'yearly', label: 'Anual' },
                    ]}
                  />

                  <Select
                    label="Termina"
                    value={recurrenceRule.ends}
                    onChange={e => setRecurrenceRule({ ...recurrenceRule, ends: e.target.value as any })}
                    options={[
                      { value: 'afterOccurrences', label: 'Después de' },
                      { value: 'onDate', label: 'En la fecha' },
                      { value: 'never', label: 'Nunca' },
                    ]}
                  />
                </div>

                {/* Specific days for weekly */}
                {recurrenceRule.type === 'weekly' && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Repetir en:</span>
                    <div className="flex items-center gap-1.5">
                      {WEEKDAYS_RECURRENCE.map(wd => {
                        const isSelected = (recurrenceRule.days || []).includes(wd.day);
                        return (
                          <button
                            key={wd.day}
                            type="button"
                            onClick={() => handleToggleRecurrenceDay(wd.day)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                              isSelected
                                ? 'bg-orange-600 text-white'
                                : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {wd.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ends options */}
                {recurrenceRule.ends === 'afterOccurrences' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Repetir durante</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={recurrenceRule.occurrences || 5}
                      onChange={e =>
                        setRecurrenceRule({ ...recurrenceRule, occurrences: parseInt(e.target.value) || 1 })
                      }
                      className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                    <span className="text-xs text-slate-500">clases</span>
                  </div>
                )}

                {recurrenceRule.ends === 'onDate' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Hasta la fecha:</span>
                    <input
                      type="date"
                      value={recurrenceRule.endDate || ''}
                      onChange={e => setRecurrenceRule({ ...recurrenceRule, endDate: e.target.value })}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              {t('notes')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Recordatorios o instrucciones de clase..."
              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {event && (
                <>
                  <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                    <Trash2 size={15} />
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleDuplicate}>
                    <Copy size={15} />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {t('save')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <LessonPlanPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectLessonPlan}
      />
    </>
  );
};

