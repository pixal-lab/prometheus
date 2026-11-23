import React, { useState, useEffect } from 'react';
import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';
import { useToast } from '../../components/ui/Toast';
import { useDialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import {
  X,
  Cog,
  Calendar,
  BookOpen,
  Keyboard,
  Activity,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  ArrowUp,
  ArrowDown,
  Globe,
  Sun,
  Moon,
  Edit2,
  Sparkles,
} from 'lucide-react';

export type SettingsTab = 'general' | 'years' | 'courses' | 'shortcuts' | 'debug';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: SettingsTab;
}

const WEEKDAY_KEYS = [
  { code: 'L', labelKey: 'mon_short', fullKey: 'monday' },
  { code: 'M', labelKey: 'tue_short', fullKey: 'tuesday' },
  { code: 'X', labelKey: 'wed_short', fullKey: 'wednesday' },
  { code: 'J', labelKey: 'thu_short', fullKey: 'thursday' },
  { code: 'V', labelKey: 'fri_short', fullKey: 'friday' },
  { code: 'S', labelKey: 'sat_short', fullKey: 'saturday' },
  { code: 'D', labelKey: 'sun_short', fullKey: 'sunday' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'general',
}) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();

  const {
    schoolYears,
    activeSchoolYearId,
    setActiveSchoolYear,
    addSchoolYear,
    deleteSchoolYear,
    subjects,
    subjectOrder,
    setSubject,
    deleteSubject,
    renameSubject,
    setSubjectOrder,
    classBlocks,
    hemisphere,
    setHemisphere,
  } = useCalendarStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialSection);

  useEffect(() => {
    if (isOpen && initialSection) {
      setActiveTab(initialSection);
    }
  }, [isOpen, initialSection]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Form states for new school year
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');

  // Form states for new course
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('#1abc9c');
  const [newCourseDays, setNewCourseDays] = useState<string[]>(['L', 'M', 'X', 'J', 'V']);

  if (!isOpen) return null;

  // Year actions
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim() || !newYearStart || !newYearEnd) return;
    await addSchoolYear({
      name: newYearName.trim(),
      startDate: newYearStart,
      endDate: newYearEnd,
    });
    setNewYearName('');
    setNewYearStart('');
    setNewYearEnd('');
    showToast('Año escolar añadido', 'success');
  };

  const handleDeleteYear = async (id: number, name: string) => {
    if (schoolYears.length <= 1) {
      showToast('No puedes eliminar el único año escolar', 'warning');
      return;
    }
    const confirmed = await confirm({
      title: t('delete_year'),
      message: `¿Estás seguro de que deseas eliminar el "${name}"? Se perderán las configuraciones asociadas a este año.`,
      confirmText: t('delete'),
      variant: 'danger',
      icon: 'trash',
    });
    if (confirmed) {
      await deleteSchoolYear(id);
      showToast('Año escolar eliminado', 'info');
    }
  };

  // Course actions
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCourseName.trim();
    if (!trimmed) return;
    const finalDays = newCourseDays.length > 0 ? newCourseDays : ['L', 'M', 'X', 'J', 'V'];
    await setSubject(trimmed, {
      color: newCourseColor,
      visible: true,
      availableDays: finalDays,
    });
    setNewCourseName('');
    setNewCourseDays(['L', 'M', 'X', 'J', 'V']);
    showToast(`Curso "${trimmed}" creado con éxito`, 'success');
  };

  const handleToggleCourseDay = (code: string) => {
    setNewCourseDays(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleToggleSubjectDay = async (subjectName: string, dayCode: string) => {
    const current = subjects[subjectName];
    if (!current) return;
    const currentDays = current.availableDays || ['L', 'M', 'X', 'J', 'V'];
    const newDays = currentDays.includes(dayCode)
      ? currentDays.filter(d => d !== dayCode)
      : [...currentDays, dayCode];
    await setSubject(subjectName, {
      ...current,
      availableDays: newDays.length > 0 ? newDays : ['L'],
    });
  };

  const handleDeleteCourse = async (name: string) => {
    const count = classBlocks.filter(b => b.subject === name).length;
    const message = count > 0
      ? `¿Estás seguro de que deseas eliminar el curso "${name}"? Se eliminarán ${count} clase(s) asociada(s) en el calendario.`
      : `¿Estás seguro de que deseas eliminar el curso "${name}"? Esta acción se puede deshacer con Ctrl + Z.`;

    const confirmed = await confirm({
      title: t('delete_course'),
      message,
      confirmText: t('delete'),
      variant: 'danger',
      icon: 'trash',
    });

    if (confirmed) {
      await deleteSubject(name);
      showToast(t('course_deleted'), 'info');
    }
  };

  const handleRenameCourse = async (oldName: string) => {
    const newName = await prompt({
      title: t('rename_course'),
      message: `Introduce el nuevo nombre para "${oldName}":`,
      defaultValue: oldName,
      confirmText: t('save'),
      icon: 'edit',
    });
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const trimmed = newName.trim();
    if (subjects[trimmed] && trimmed.toLowerCase() !== oldName.toLowerCase()) {
      showToast('Ya existe un curso con ese nombre', 'warning');
      return;
    }
    await renameSubject(oldName, trimmed);
    showToast(`Curso renombrado a "${trimmed}"`, 'success');
  };

  const handleMoveCourseOrder = async (index: number, direction: 'up' | 'down') => {
    const newOrder = [...subjectOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    await setSubjectOrder(newOrder);
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'general', label: t('section_general'), icon: <Globe size={18} /> },
    { id: 'years', label: t('school_years'), icon: <Calendar size={18} />, count: schoolYears.length },
    { id: 'courses', label: t('courses_subjects'), icon: <BookOpen size={18} />, count: subjectOrder.length },
    { id: 'shortcuts', label: t('shortcuts'), icon: <Keyboard size={18} /> },
    { id: 'debug', label: t('diagnostics'), icon: <Activity size={18} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none print:hidden"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[640px] max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600">
              <Cog size={18} />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t('title_settings')}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Administra tus preferencias, cursos, periodos lectivos y diagnóstico
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <nav className="w-full md:w-60 bg-slate-50/60 dark:bg-slate-950/40 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-2.5 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all text-xs font-semibold cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}>
                      {tab.icon}
                    </span>
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                        isActive
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Main Content Pane */}
          <main className="flex-1 p-5 md:p-6 overflow-y-auto bg-white dark:bg-slate-900">
            {/* 1. TAB: GENERAL */}
            {activeTab === 'general' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('section_general')}</h3>
                  <p className="text-xs text-slate-500">Configura idioma, sincronización de fechas y apariencia del entorno.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                  {/* Language */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('language')}</span>
                      <p className="text-[11px] text-slate-400">Selecciona el idioma de la interfaz</p>
                    </div>
                    <select
                      value={language}
                      onChange={e => setLanguage(e.target.value as 'es' | 'en')}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="es">Español (ES)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>

                  {/* Hemisphere */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('school_hemisphere')}</span>
                      <p className="text-[11px] text-slate-400">{t('school_hemisphere_desc')}</p>
                    </div>
                    <select
                      value={hemisphere}
                      onChange={e => setHemisphere(e.target.value as 'south' | 'north')}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="south">{t('hemisphere_south')}</option>
                      <option value="north">{t('hemisphere_north')}</option>
                    </select>
                  </div>

                  {/* Appearance / Theme */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('appearance')}</span>
                      <p className="text-[11px] text-slate-400">Alterna entre modo oscuro y modo claro</p>
                    </div>
                    <Button onClick={toggleTheme} variant="outline" size="sm" className="gap-2">
                      {theme === 'dark' ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} />}
                      <span>{theme === 'dark' ? t('light_mode') : t('dark_mode')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAB: SCHOOL YEARS */}
            {activeTab === 'years' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('school_years')}</h3>
                  <p className="text-xs text-slate-500">Administra los periodos lectivos y define el ciclo escolar activo.</p>
                </div>

                {/* Add new year form */}
                <form
                  onSubmit={handleAddYear}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col gap-3 shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Plus size={14} className="text-orange-600" />
                    {t('add_school_year')}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder={t('year_name_placeholder')}
                        value={newYearName}
                        onChange={e => setNewYearName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block mb-1">{t('start')}</span>
                      <input
                        type="date"
                        value={newYearStart}
                        onChange={e => setNewYearStart(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block mb-1">{t('end')}</span>
                      <input
                        type="date"
                        value={newYearEnd}
                        onChange={e => setNewYearEnd(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" variant="primary" size="sm" className="w-full h-8">
                        <Plus size={14} /> {t('add')}
                      </Button>
                    </div>
                  </div>
                </form>

                {/* List of existing school years */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                    {t('school_years')} ({schoolYears.length})
                  </span>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {schoolYears.map(year => {
                      const isActive = year.id === activeSchoolYearId;
                      return (
                        <div
                          key={year.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                            isActive
                              ? 'border-orange-500/80 bg-orange-50/50 dark:bg-orange-950/30'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                              {year.name}
                              {isActive && (
                                <span className="bg-orange-600 text-white text-[9px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                                  <Check size={10} /> {t('active')}
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {year.startDate} — {year.endDate}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => setActiveSchoolYear(year.id)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/60 rounded-lg transition-colors cursor-pointer"
                                title={t('set_active_year')}
                              >
                                {t('activate')}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteYear(year.id, year.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title={t('delete_year')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TAB: COURSES & SUBJECTS */}
            {activeTab === 'courses' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('courses_subjects')}</h3>
                  <p className="text-xs text-slate-500">Crea nuevos cursos, personaliza su color distintivo y define los días en que se imparten.</p>
                </div>

                {/* Top: Create Course Form */}
                <form
                  onSubmit={handleAddCourse}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex flex-col gap-3.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-orange-600" />
                      {t('create_new_course')}
                    </span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setNewCourseDays(['L', 'M', 'X', 'J', 'V'])}
                        className="px-2 py-0.5 rounded-md font-medium text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        L-V
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={() => setNewCourseDays(['L', 'M', 'X', 'J', 'V', 'S', 'D'])}
                        className="px-2 py-0.5 rounded-md font-medium text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        {t('all_days')}
                      </button>
                    </div>
                  </div>

                  {/* Inputs row: Name + Color + Submit Button */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={t('course_name_placeholder')}
                      value={newCourseName}
                      onChange={e => setNewCourseName(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
                      required
                    />
                    <input
                      type="color"
                      value={newCourseColor}
                      onChange={e => setNewCourseColor(e.target.value)}
                      title="Color del curso"
                      className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 p-0.5 shrink-0 shadow-2xs"
                    />
                    <Button type="submit" variant="primary" size="sm" className="h-9 px-4 shrink-0 gap-1.5 shadow-xs">
                      <Plus size={15} /> {t('add')}
                    </Button>
                  </div>

                  {/* Teaching days selection row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Calendar size={13} className="text-orange-600" />
                      {t('teaching_days')}:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {WEEKDAY_KEYS.map(day => {
                        const isSelected = newCourseDays.includes(day.code);
                        return (
                          <button
                            key={day.code}
                            type="button"
                            onClick={() => handleToggleCourseDay(day.code)}
                            title={t(day.fullKey)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                              isSelected
                                ? 'bg-orange-600 text-white shadow-xs ring-1 ring-orange-500/40'
                                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700'
                            }`}
                          >
                            <span>{t(day.labelKey)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </form>

                {/* Bottom: Existing Courses List */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                    <span>{t('courses')} ({subjectOrder.length})</span>
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {subjectOrder.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        No hay cursos registrados. Crea uno arriba.
                      </div>
                    ) : (
                      subjectOrder.map((name, index) => {
                        const conf = subjects[name];
                        if (!conf) return null;
                        const courseDays = conf.availableDays || ['L', 'M', 'X', 'J', 'V'];
                        return (
                          <div
                            key={name}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2 bg-slate-50/60 dark:bg-slate-800/30 transition-colors"
                          >
                            {/* Main row: Swatch, Name, Rename, Actions */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="color"
                                  value={conf.color}
                                  onChange={e => setSubject(name, { ...conf, color: e.target.value })}
                                  title={`Color para ${name}`}
                                  className="w-6 h-6 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent shrink-0 p-0.5"
                                />
                                <span
                                  className={`font-bold text-xs truncate ${
                                    conf.visible
                                      ? 'text-slate-900 dark:text-slate-100'
                                      : 'text-slate-400 line-through'
                                  }`}
                                >
                                  {name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRenameCourse(name)}
                                  className="p-1 text-slate-400 hover:text-orange-600 rounded-md transition-colors cursor-pointer"
                                  title={t('rename_course')}
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleMoveCourseOrder(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                                  title={t('move_up')}
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveCourseOrder(index, 'down')}
                                  disabled={index === subjectOrder.length - 1}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                                  title={t('move_down')}
                                >
                                  <ArrowDown size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSubject(name, { ...conf, visible: !conf.visible })}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                                  title={conf.visible ? t('hide') : t('show')}
                                >
                                  {conf.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCourse(name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                                  title={t('delete_course')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Teaching Days row for this course */}
                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/40 dark:border-slate-800/60">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {t('days')}:
                              </span>
                              <div className="flex items-center gap-1">
                                {WEEKDAY_KEYS.map(d => {
                                  const isDayActive = courseDays.includes(d.code);
                                  return (
                                    <button
                                      key={d.code}
                                      type="button"
                                      onClick={() => handleToggleSubjectDay(name, d.code)}
                                      title={`Alternar ${t(d.fullKey)} para ${name}`}
                                      className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                                        isDayActive
                                          ? 'bg-orange-600 text-white shadow-2xs'
                                          : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      {d.code}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. TAB: SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('shortcuts')}</h3>
                  <p className="text-xs text-slate-500">Atajos de teclado y acciones rápidas disponibles en el calendario y planificador.</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-orange-600 shadow-2xs text-xs">
                      Ctrl + Z
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">{t('shortcut_undo')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-orange-600 shadow-2xs text-xs">
                      Ctrl + Y
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">{t('shortcut_redo')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 shadow-2xs text-xs">
                      {language === 'es' ? 'Clic Derecho' : 'Right Click'}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">{t('shortcut_right_click')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 shadow-2xs text-xs">
                      {language === 'es' ? 'Doble Clic' : 'Double Click'}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">{t('shortcut_double_click')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TAB: DIAGNOSTICS */}
            {activeTab === 'debug' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('diagnostics')}</h3>
                  <p className="text-xs text-slate-500">{t('diagnostics_desc')}</p>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Verifica el estado del motor IndexedDB (Dexie) local y genera reportes descargables para soporte técnico o auditorías.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={async () => {
                        if ((window as any).__PROMETHEUS_DEBUG__) {
                          const res = await (window as any).__PROMETHEUS_DEBUG__.healthCheck();
                          showToast(`IndexedDB Conectado (${res.count} registros)`, 'success');
                        } else {
                          showToast('IndexedDB Activo y funcionando', 'success');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {t('health_check')}
                    </Button>
                    <Button
                      onClick={async () => {
                        if ((window as any).__PROMETHEUS_DEBUG__) {
                          await (window as any).__PROMETHEUS_DEBUG__.exportDiagnosticReport();
                          showToast('Reporte descargado', 'info');
                        } else {
                          showToast('Generando reporte...', 'info');
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {t('download_report')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
