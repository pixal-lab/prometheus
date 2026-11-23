import React, { useState, useEffect } from 'react';
import { LessonItem, LessonPlanContent } from '../../../core/types/lesson.types';
import { useLessonPlannerStore } from '../store/useLessonPlannerStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toast';
import { useDialog } from '../../../components/ui/Dialog';
import { exportLessonToDocx } from '../services/docxExporter';
import { exportLessonToPdf, exportLessonToTxt } from '../services/pdfExporter';
import { FileDown, FileText, Bookmark, Save, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

interface LessonEditorProps {
  lesson: LessonItem;
  path: string[];
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, path }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { prompt, confirm } = useDialog();
  const { updateLessonContent, deleteNode, saveAsTemplate, templates } = useLessonPlannerStore();

  const [title, setTitle] = useState(lesson.title);
  const [content, setContent] = useState<LessonPlanContent>(lesson.content);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setTitle(lesson.title);
    setContent(lesson.content);
    setIsDirty(false);
  }, [lesson]);

  const handleChange = (key: keyof LessonPlanContent, val: string) => {
    setContent(prev => ({ ...prev, [key]: val }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await updateLessonContent(path, title, content);
    setIsDirty(false);
    showToast('Plan de lección guardado', 'success');
  };

  const handleApplyTemplate = (tplId: string) => {
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;
    setContent(prev => ({ ...prev, ...tpl.content }));
    setIsDirty(true);
    showToast(`Plantilla "${tpl.name}" aplicada`, 'info');
  };

  const handleSaveTemplate = async () => {
    const name = await prompt({
      title: 'Guardar como Plantilla',
      message: 'Ingresa un nombre descriptivo para guardar esta lección como plantilla:',
      defaultValue: title,
      placeholder: 'Ej: Plantilla de Clase DUA',
      confirmText: 'Guardar Plantilla',
      icon: 'template',
    });
    if (name?.trim()) {
      await saveAsTemplate(name.trim(), content);
      showToast('Plantilla guardada exitosamente', 'success');
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Eliminar Lección',
      message: `¿Estás seguro de que deseas eliminar la lección "${title}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
      icon: 'trash',
    });
    if (confirmed) {
      await deleteNode(path);
      showToast('Lección eliminada', 'info');
    }
  };

  return (
    <div className="flex flex-col gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            {path.join(' > ')}
          </span>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              className="text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 focus:outline-none text-slate-900 dark:text-slate-100 transition-colors w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isDirty && (
            <Button onClick={handleSave} variant="primary" size="sm">
              <Save size={15} /> {t('save')}
            </Button>
          )}

          <Button
            onClick={() => exportLessonToDocx(lesson, path)}
            variant="outline"
            size="sm"
            title="Descargar documento Word (.docx)"
          >
            <FileDown size={15} className="text-blue-600" /> Word (.docx)
          </Button>

          <Button
            onClick={() => exportLessonToPdf(lesson, path)}
            variant="outline"
            size="sm"
            title="Descargar en PDF"
          >
            <FileText size={15} className="text-rose-600" /> PDF
          </Button>

          <Button
            onClick={() => exportLessonToTxt(lesson, path)}
            variant="ghost"
            size="sm"
            title="Exportar a texto plano"
          >
            TXT
          </Button>

          <Button onClick={handleSaveTemplate} variant="ghost" size="sm" title={t('save_as_template')}>
            <Bookmark size={15} />
          </Button>

          <Button onClick={handleDelete} variant="ghost" size="sm" className="text-rose-600" title={t('delete')}>
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* Templates Quick Selector */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
          <Bookmark size={14} className="text-orange-600" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">{t('use_template')}</span>
          <div className="flex flex-wrap gap-1.5">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl.id)}
                className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-500 text-slate-700 dark:text-slate-300 font-medium cursor-pointer transition-colors"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {t('lesson_objectives')}
          </label>
          <textarea
            rows={3}
            value={content.objectives}
            onChange={e => handleChange('objectives', e.target.value)}
            placeholder={t('objectives_ph')}
            className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {t('lesson_readings')}
          </label>
          <textarea
            rows={3}
            value={content.readings}
            onChange={e => handleChange('readings', e.target.value)}
            placeholder={t('readings_ph')}
            className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
          />
        </div>
      </div>

      {/* Pedagogical Moments */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 border-b border-orange-200 dark:border-orange-950/60 pb-1.5">
          {t('pedagogical_moments')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              1. {t('lesson_warmup')}
            </label>
            <textarea
              rows={4}
              value={content.warmUp}
              onChange={e => handleChange('warmUp', e.target.value)}
              placeholder={t('warmup_ph')}
              className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              2. {t('lesson_presentation')}
            </label>
            <textarea
              rows={4}
              value={content.presentation}
              onChange={e => handleChange('presentation', e.target.value)}
              placeholder={t('presentation_ph')}
              className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              3. {t('lesson_guided')}
            </label>
            <textarea
              rows={4}
              value={content.guidedPractice}
              onChange={e => handleChange('guidedPractice', e.target.value)}
              placeholder={t('guided_ph')}
              className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              4. {t('lesson_independent')}
            </label>
            <textarea
              rows={4}
              value={content.independentPractice}
              onChange={e => handleChange('independentPractice', e.target.value)}
              placeholder={t('independent_ph')}
              className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              5. {t('lesson_closure')}
            </label>
            <textarea
              rows={4}
              value={content.closure}
              onChange={e => handleChange('closure', e.target.value)}
              placeholder={t('closure_ph')}
              className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {t('lesson_accommodations')}
          </label>
          <textarea
            rows={2}
            value={content.accommodations}
            onChange={e => handleChange('accommodations', e.target.value)}
            placeholder={t('accommodations_ph')}
            className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
  );
};

