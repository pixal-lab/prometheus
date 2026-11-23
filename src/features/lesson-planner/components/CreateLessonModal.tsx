import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useLessonPlannerStore } from '../store/useLessonPlannerStore';
import { LessonPlanContent } from '../../../core/types/lesson.types';
import { useToast } from '../../../components/ui/Toast';
import { useTranslation } from '../../../core/i18n/useTranslation';
import { BookOpen, Sparkles, CheckSquare, Layers } from 'lucide-react';

interface CreateLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourse?: string;
  defaultSubject?: string;
}

export const CreateLessonModal: React.FC<CreateLessonModalProps> = ({
  isOpen,
  onClose,
  defaultCourse = '',
  defaultSubject = '',
}) => {
  const { t } = useTranslation();
  const { templates, createLessonWithStructure } = useLessonPlannerStore();
  const { showToast } = useToast();

  const [course, setCourse] = useState(defaultCourse || '5th Grade');
  const [subject, setSubject] = useState(defaultSubject || 'Inglés');
  const [unit, setUnit] = useState('Unidad 1');
  const [lessonNumber, setLessonNumber] = useState('1');
  const [lessonTitle, setLessonTitle] = useState('');
  const [approach, setApproach] = useState<'Traditional' | 'Inquiry-Based' | 'Project-Based'>('Traditional');
  const [differentiation, setDifferentiation] = useState<'None' | 'Struggling' | 'Advanced'>('None');
  const [promptText, setPromptText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Selected pedagogical moments
  const [sections, setSections] = useState({
    objectives: true,
    readings: true,
    warmUp: true,
    presentation: true,
    guidedPractice: true,
    independentPractice: true,
    closure: true,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tpl = templates.find(t => t.id === templateId);
    if (tpl?.content) {
      if (tpl.content.objectives) setPromptText(prev => prev || tpl.content.objectives || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titleToUse =
      lessonTitle.trim() || `Lección ${lessonNumber}: ${promptText.trim() ? promptText.slice(0, 30) : 'Sin Título'}`;

    // Build structured pedagogical content
    const diffNote =
      differentiation === 'Struggling'
        ? 'Adaptaciones para estudiantes con dificultades: apoyo visual adicional, tiempo extra y andamiaje paso a paso.'
        : differentiation === 'Advanced'
        ? 'Actividades de extensión para estudiantes avanzados: investigación complementaria y retos de aplicación compleja.'
        : '';

    const content: LessonPlanContent = {
      objectives: sections.objectives
        ? `• Comprender los conceptos fundamentales de ${promptText.trim() || titleToUse}.\n• Enfoque metodológico: ${approach === 'Traditional' ? 'Tradicional / Expositivo' : approach === 'Inquiry-Based' ? 'Basado en la Indagación' : 'Basado en Proyectos'}.`
        : '',
      readings: sections.readings
        ? `Capítulo correspondiente a ${unit}, páginas de referencia seleccionadas.`
        : '',
      warmUp: sections.warmUp
        ? `Actividad inicial (5-10 min): Pregunta motivadora o lluvia de ideas sobre "${promptText.trim() || titleToUse}".`
        : '',
      presentation: sections.presentation
        ? `Presentación y modelado docente: Explicación de conceptos clave con ejemplos interactivos.`
        : '',
      guidedPractice: sections.guidedPractice
        ? `Trabajo guiado en parejas o grupos pequeños con retroalimentación docente formativa.`
        : '',
      independentPractice: sections.independentPractice
        ? `Resolución individual de guía o actividad práctica para consolidar el aprendizaje.`
        : '',
      closure: sections.closure
        ? `Ticket de salida o síntesis grupal: ¿Qué aprendimos hoy sobre ${promptText.trim() || titleToUse}?`
        : '',
      accommodations: diffNote,
    };

    await createLessonWithStructure(
      course.trim(),
      subject.trim(),
      unit.trim(),
      titleToUse,
      content,
      selectedTemplateId || undefined
    );

    showToast(`Lección "${titleToUse}" creada con éxito`, 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('create_lesson')} maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Course, Subject, Unit, Lesson Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('course_name_field')}:</label>
            <input
              type="text"
              required
              placeholder="Ej: 5th Grade"
              value={course}
              onChange={e => setCourse(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('subject_name_field')}:</label>
            <input
              type="text"
              required
              placeholder="Ej: Inglés / Ciencias"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('unit_name_field')}:</label>
            <input
              type="text"
              required
              placeholder="Ej: Unidad 1: Ecosistemas"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('lesson_num_field')}:</label>
            <input
              type="number"
              min="1"
              required
              placeholder="Ej: 1"
              value={lessonNumber}
              onChange={e => setLessonNumber(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Title / Topic Prompt */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t('lesson_title_field')}:
          </label>
          <input
            type="text"
            placeholder="Ej: Introducción a la Fotosíntesis y Productores"
            value={lessonTitle}
            onChange={e => setLessonTitle(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Pedagogical Approach & Differentiation Needs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('approach_field')}:
            </label>
            <select
              value={approach}
              onChange={e => setApproach(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="Traditional">{t('approach_traditional')}</option>
              <option value="Inquiry-Based">{t('approach_inquiry')}</option>
              <option value="Project-Based">{t('approach_pbl')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t('diff_field')}:
            </label>
            <select
              value={differentiation}
              onChange={e => setDifferentiation(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="None">{t('diff_none')}</option>
              <option value="Struggling">{t('diff_struggling')}</option>
              <option value="Advanced">{t('diff_advanced')}</option>
            </select>
          </div>
        </div>

        {/* Moments Checklist */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CheckSquare size={14} className="text-orange-600" />
            {t('pedagogical_moments')}:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.objectives}
                onChange={() => toggleSection('objectives')}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>{t('lesson_objectives')}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.readings}
                onChange={() => toggleSection('readings')}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>{t('lesson_readings')}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.warmUp}
                onChange={() => toggleSection('warmUp')}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>{t('lesson_warmup')}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.presentation}
                onChange={() => toggleSection('presentation')}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>{t('lesson_presentation')}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.guidedPractice}
                onChange={() => toggleSection('guidedPractice')}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>{t('lesson_guided')}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.independentPractice}
                onChange={() => toggleSection('independentPractice')}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>{t('lesson_independent')}</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={sections.closure}
                onChange={() => toggleSection('closure')}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>{t('lesson_closure')}</span>
            </label>
          </div>
        </div>

        {/* Prompt description */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Descripción / Prompt de Contenido:
          </label>
          <textarea
            rows={2}
            value={promptText}
            onChange={e => setPromptText(e.target.value)}
            placeholder="Describe brevemente el contenido pedagógico clave o actividades de la clase..."
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Template Select */}
        {templates.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers size={14} className="text-orange-600" /> {t('use_template')}
            </label>
            <select
              value={selectedTemplateId}
              onChange={e => handleTemplateChange(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
            >
              <option value="">-- Sin plantilla (estructura estándar) --</option>
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button onClick={onClose} variant="ghost" size="sm">
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" size="sm">
            <Sparkles size={16} /> {t('create_lesson_btn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
