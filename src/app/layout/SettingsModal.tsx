import React, { useState, useEffect, useRef } from 'react';
import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';
import { useToast } from '../../components/ui/Toast';
import { useDialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
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
  Compass,
  Sun,
  Moon,
  Edit2,
  Sparkles,
  HardDrive,
  Download,
  Upload,
  AlertCircle,
  Database,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { BackupService } from '../../core/storage/backupService';
import { reloadAllStores } from '../../core/storage/rehydrate';
import { useSettingsModal } from '../../core/settings/useSettingsModal';
import { db } from '../../core/storage/dexieStorage';

export type SettingsTab = 'general' | 'years' | 'courses' | 'backup' | 'shortcuts' | 'debug';

export interface SettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialSection?: SettingsTab;
  onDataImported?: () => void;
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

const COURSE_COLOR_PRESETS = [
  '#1abc9c', // Teal
  '#2ecc71', // Green
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#e67e22', // Orange
  '#e74c3c', // Red
  '#f1c40f', // Amber
  '#34495e', // Slate
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
  initialSection = 'general',
  onDataImported,
}) => {
  const modalStore = useSettingsModal();
  const isOpen = propIsOpen !== undefined ? propIsOpen : modalStore.isOpen;
  const onClose = propOnClose !== undefined ? propOnClose : modalStore.closeSettings;
  const effectiveInitial = propIsOpen !== undefined ? initialSection : (modalStore.activeTab || initialSection);

  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const { confirm, prompt } = useDialog();

  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportingBackup, setIsImportingBackup] = useState(false);

  // Tab state synchronized with modal store
  const [activeTab, setActiveTab] = useState<SettingsTab>(effectiveInitial);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    modalStore.setActiveTab(tab);
  };

  useEffect(() => {
    if (isOpen && effectiveInitial) {
      setActiveTab(effectiveInitial);
    }
  }, [isOpen, effectiveInitial]);

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

  const {
    schoolYears,
    activeSchoolYearId,
    setActiveSchoolYear,
    addSchoolYear,
    updateSchoolYear,
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

  // Form states for new school year
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');

  // Inline edit state for school years
  const [editingYearId, setEditingYearId] = useState<number | null>(null);
  const [editYearName, setEditYearName] = useState('');
  const [editYearStart, setEditYearStart] = useState('');
  const [editYearEnd, setEditYearEnd] = useState('');

  // Form states for new course
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('#1abc9c');
  const [newCourseDays, setNewCourseDays] = useState<string[]>(['L', 'M', 'X', 'J', 'V']);

  // Diagnostics live database statistics
  const [dbStats, setDbStats] = useState<{ isConnected: boolean; count: number } | null>(null);

  useEffect(() => {
    if (activeTab === 'debug' && isOpen) {
      try {
        const isConnected = db.isOpen();
        db.store.count().then(count => {
          setDbStats({ isConnected, count });
        }).catch(() => {
          setDbStats({ isConnected: false, count: 0 });
        });
      } catch {
        setDbStats({ isConnected: false, count: 0 });
      }
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  // Year actions
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newYearName.trim();
    if (!trimmed || !newYearStart || !newYearEnd) return;

    if (newYearStart >= newYearEnd) {
      showToast(t('error_invalid_date_range'), 'warning');
      return;
    }

    if (schoolYears.some(y => y.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      showToast(t('error_year_exists'), 'warning');
      return;
    }

    await addSchoolYear({
      name: trimmed,
      startDate: newYearStart,
      endDate: newYearEnd,
    });
    setNewYearName('');
    setNewYearStart('');
    setNewYearEnd('');
    showToast(t('year_added'), 'success');
  };

  const handleStartEditYear = (year: { id: number; name: string; startDate: string; endDate: string }) => {
    setEditingYearId(year.id);
    setEditYearName(year.name);
    setEditYearStart(year.startDate);
    setEditYearEnd(year.endDate);
  };

  const handleCancelEditYear = () => {
    setEditingYearId(null);
    setEditYearName('');
    setEditYearStart('');
    setEditYearEnd('');
  };

  const handleSaveEditYear = async (id: number) => {
    const trimmed = editYearName.trim();
    if (!trimmed || !editYearStart || !editYearEnd) return;

    if (editYearStart >= editYearEnd) {
      showToast(t('error_invalid_date_range'), 'warning');
      return;
    }

    const duplicate = schoolYears.some(
      y => y.id !== id && y.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      showToast(t('error_year_exists'), 'warning');
      return;
    }

    await updateSchoolYear(id, {
      name: trimmed,
      startDate: editYearStart,
      endDate: editYearEnd,
    });
    handleCancelEditYear();
    showToast(t('year_updated'), 'success');
  };

  const handleDeleteYear = async (id: number, name: string) => {
    if (schoolYears.length <= 1) {
      showToast(t('no_delete_single_year'), 'warning');
      return;
    }
    const confirmed = await confirm({
      title: t('confirm_delete_year_title'),
      message: `${t('confirm_delete_year_msg')} ("${name}")`,
      confirmText: t('delete'),
      variant: 'danger',
      icon: 'trash',
    });
    if (confirmed) {
      await deleteSchoolYear(id);
      showToast(t('year_deleted'), 'info');
    }
  };

  // Course actions
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCourseName.trim();
    if (!trimmed) return;

    if (subjects[trimmed]) {
      showToast(t('error_course_exists'), 'warning');
      return;
    }

    const finalDays = newCourseDays.length > 0 ? newCourseDays : ['L', 'M', 'X', 'J', 'V'];
    await setSubject(trimmed, {
      color: newCourseColor,
      visible: true,
      availableDays: finalDays,
    });
    setNewCourseName('');
    setNewCourseDays(['L', 'M', 'X', 'J', 'V']);
    showToast(t('course_created'), 'success');
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
      ? `${t('confirm_delete_course_classes')} ("${name}", ${count} clases)`
      : `${t('confirm_delete_course_simple')} ("${name}")`;

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
      message: `${t('edit')}: "${oldName}"`,
      defaultValue: oldName,
      confirmText: t('save'),
      icon: 'edit',
    });
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const trimmed = newName.trim();
    if (subjects[trimmed] && trimmed.toLowerCase() !== oldName.toLowerCase()) {
      showToast(t('error_course_exists'), 'warning');
      return;
    }
    await renameSubject(oldName, trimmed);
    showToast(t('course_renamed'), 'success');
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

  // Backup actions
  const handleExportBackup = async () => {
    try {
      await BackupService.exportFullBackup();
      showToast(t('backup_export_success'), 'success');
    } catch {
      showToast(t('backup_export_error'), 'error');
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const proceed = await confirm({
      title: t('confirm_import_backup_title'),
      message: t('confirm_import_backup_msg'),
      confirmText: t('import'),
      variant: 'danger',
      icon: 'warning',
    });

    if (!proceed) {
      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
      return;
    }

    setIsImportingBackup(true);
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const res = await BackupService.importBackup(text);
        if (res.success) {
          showToast(`${t('backup_import_success')} (${res.count} items)`, 'success');
          if (onDataImported) {
            onDataImported();
          } else {
            reloadAllStores();
          }
          onClose();
        } else {
          showToast(res.message || t('backup_import_invalid_file'), 'error');
        }
      } catch {
        showToast(t('backup_import_invalid_file'), 'error');
      } finally {
        setIsImportingBackup(false);
        if (backupFileInputRef.current) backupFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'general', label: t('section_general'), icon: <Globe size={18} /> },
    { id: 'years', label: t('school_years'), icon: <Calendar size={18} />, count: schoolYears.length },
    { id: 'courses', label: t('courses_subjects'), icon: <BookOpen size={18} />, count: subjectOrder.length },
    { id: 'backup', label: t('tab_backup'), icon: <HardDrive size={18} /> },
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
                {t('settings_subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('close')}
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <nav
            role="tablist"
            aria-label={t('title_settings')}
            className="w-full md:w-60 bg-slate-50/60 dark:bg-slate-950/40 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-2.5 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0"
          >
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`settings-tabpanel-${tab.id}`}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
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
          <main
            role="tabpanel"
            id={`settings-tabpanel-${activeTab}`}
            aria-labelledby={`settings-tab-${activeTab}`}
            className="flex-1 p-5 md:p-6 overflow-y-auto bg-white dark:bg-slate-900"
          >
            {/* 1. TAB: GENERAL */}
            {activeTab === 'general' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('section_general')}</h3>
                  <p className="text-xs text-slate-500">{t('settings_general_desc')}</p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                  {/* Language */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('language')}</span>
                      <p className="text-[11px] text-slate-400">{t('settings_language_desc')}</p>
                    </div>
                    <div className="w-48 shrink-0">
                      <Select
                        value={language}
                        onChange={e => setLanguage(e.target.value as 'es' | 'en')}
                        icon={<Globe size={14} className="text-orange-500" />}
                        options={[
                          { value: 'es', label: 'Español (ES)' },
                          { value: 'en', label: 'English (US)' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Hemisphere */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('school_hemisphere')}</span>
                      <p className="text-[11px] text-slate-400">{t('school_hemisphere_desc')}</p>
                    </div>
                    <div className="w-56 shrink-0">
                      <Select
                        value={hemisphere}
                        onChange={e => setHemisphere(e.target.value as 'south' | 'north')}
                        icon={<Compass size={14} className="text-orange-500" />}
                        options={[
                          { value: 'south', label: t('hemisphere_south') },
                          { value: 'north', label: t('hemisphere_north') },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Appearance / Theme */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('appearance')}</span>
                      <p className="text-[11px] text-slate-400">{t('settings_appearance_desc')}</p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          theme !== 'dark'
                            ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <Sun size={14} className="text-amber-500" />
                        <span>{t('light_mode')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <Moon size={14} className="text-blue-400" />
                        <span>{t('dark_mode')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAB: SCHOOL YEARS */}
            {activeTab === 'years' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('school_years')}</h3>
                  <p className="text-xs text-slate-500">{t('settings_years_desc')}</p>
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

                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 items-end">
                    <div className="sm:col-span-3">
                      <Input
                        label={t('school_year')}
                        type="text"
                        placeholder={t('year_name_placeholder')}
                        value={newYearName}
                        onChange={e => setNewYearName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label={t('start')}
                        type="date"
                        icon={<Calendar size={14} className="text-orange-500" />}
                        value={newYearStart}
                        onChange={e => setNewYearStart(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label={t('end')}
                        type="date"
                        icon={<Calendar size={14} className="text-orange-500" />}
                        value={newYearEnd}
                        onChange={e => setNewYearEnd(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button type="submit" variant="primary" size="sm" className="h-9 px-4">
                      <Plus size={14} /> {t('add')}
                    </Button>
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
                      const isEditing = editingYearId === year.id;

                      if (isEditing) {
                        return (
                          <div
                            key={year.id}
                            className="p-3.5 rounded-xl border border-orange-400/80 bg-orange-50/30 dark:bg-orange-950/20 flex flex-col gap-3 transition-all"
                          >
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                              <Edit2 size={13} /> {t('edit_year_title')}
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-end">
                              <div className="sm:col-span-3">
                                <Input
                                  label={t('school_year')}
                                  value={editYearName}
                                  onChange={e => setEditYearName(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Input
                                  label={t('start')}
                                  type="date"
                                  value={editYearStart}
                                  onChange={e => setEditYearStart(e.target.value)}
                                  required
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <Input
                                  label={t('end')}
                                  type="date"
                                  value={editYearEnd}
                                  onChange={e => setEditYearEnd(e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex justify-end items-center gap-2 pt-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEditYear}
                              >
                                {t('cancel')}
                              </Button>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() => handleSaveEditYear(year.id)}
                                className="gap-1.5"
                              >
                                <Save size={13} /> {t('save')}
                              </Button>
                            </div>
                          </div>
                        );
                      }

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
                              onClick={() => handleStartEditYear(year)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors cursor-pointer"
                              title={t('edit_year')}
                              aria-label={t('edit_year')}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteYear(year.id, year.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title={t('delete_year')}
                              aria-label={t('delete_year')}
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
                  <p className="text-xs text-slate-500">{t('settings_courses_desc')}</p>
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

                  {/* Inputs row: Name + Color Presets + Native Color Picker + Submit Button */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={t('course_name_placeholder')}
                        value={newCourseName}
                        onChange={e => setNewCourseName(e.target.value)}
                        className="h-9"
                        required
                      />
                      <input
                        type="color"
                        value={newCourseColor}
                        onChange={e => setNewCourseColor(e.target.value)}
                        title={t('course_color')}
                        aria-label={t('course_color')}
                        className="w-9 h-9 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 p-0.5 shrink-0 shadow-2xs hover:border-orange-400 transition-all"
                      />
                      <Button type="submit" variant="primary" size="sm" className="h-9 px-4 shrink-0 gap-1.5 shadow-xs">
                        <Plus size={15} /> {t('add')}
                      </Button>
                    </div>

                    {/* Curated Color Presets Palette */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium mr-1">{t('color_presets')}:</span>
                      {COURSE_COLOR_PRESETS.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setNewCourseColor(preset)}
                          style={{ backgroundColor: preset }}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer border border-white/40 dark:border-slate-900/40 shadow-2xs ${
                            newCourseColor.toLowerCase() === preset.toLowerCase()
                              ? 'scale-125 ring-2 ring-orange-500 ring-offset-1'
                              : 'hover:scale-110 opacity-90 hover:opacity-100'
                          }`}
                          title={preset}
                          aria-label={preset}
                        />
                      ))}
                    </div>
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
                            aria-pressed={isSelected}
                            className={`h-8 min-w-[34px] px-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-95 ${
                              isSelected
                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm ring-2 ring-orange-500/30 font-black'
                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500/50 hover:text-orange-600 dark:hover:text-orange-400 shadow-2xs'
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
                        {t('no_courses_registered')}
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
                                  title={`${t('color_for')} ${name}`}
                                  aria-label={`${t('color_for')} ${name}`}
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
                                  aria-label={`${t('rename_course')}: ${name}`}
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
                                  aria-label={t('move_up')}
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveCourseOrder(index, 'down')}
                                  disabled={index === subjectOrder.length - 1}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                                  title={t('move_down')}
                                  aria-label={t('move_down')}
                                >
                                  <ArrowDown size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSubject(name, { ...conf, visible: !conf.visible })}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                                  title={conf.visible ? t('hide') : t('show')}
                                  aria-label={conf.visible ? t('hide') : t('show')}
                                >
                                  {conf.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCourse(name)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
                                  title={t('delete_course')}
                                  aria-label={t('delete_course')}
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
                                      title={`${t('toggle_day_for')} ${t(d.fullKey)}: ${name}`}
                                      aria-pressed={isDayActive}
                                      className={`h-6 min-w-[26px] px-1 rounded-lg text-[10px] font-extrabold transition-all duration-150 flex items-center justify-center cursor-pointer select-none active:scale-95 ${
                                        isDayActive
                                          ? 'bg-orange-600 text-white shadow-2xs font-black'
                                          : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-orange-300'
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

            {/* 4. TAB: BACKUPS */}
            {activeTab === 'backup' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('backup_title')}</h3>
                  <p className="text-xs text-slate-500">{t('settings_backup_desc')}</p>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xl text-orange-900 dark:text-orange-200 text-xs">
                  <AlertCircle className="shrink-0 text-orange-600 dark:text-orange-400 mt-0.5" size={16} />
                  <p className="leading-relaxed">{t('backup_desc')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Export Box */}
                  <div className="flex flex-col p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 justify-between gap-4 shadow-2xs">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Download size={16} className="text-orange-600" /> {t('export_json')}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {t('export_json_desc')}
                      </p>
                    </div>
                    <Button onClick={handleExportBackup} variant="primary" size="sm" className="gap-2">
                      <Download size={14} /> {t('download_backup')}
                    </Button>
                  </div>

                  {/* Import Box */}
                  <div className="flex flex-col p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 justify-between gap-4 shadow-2xs">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Upload size={16} className="text-blue-600" /> {t('import_json')}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {t('import_json_desc')}
                      </p>
                    </div>
                    <input
                      type="file"
                      ref={backupFileInputRef}
                      onChange={handleFileImport}
                      accept=".json"
                      className="hidden"
                    />
                    <Button
                      onClick={() => backupFileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      disabled={isImportingBackup}
                      className="gap-2"
                    >
                      <Upload size={14} /> {isImportingBackup ? t('loading_file') : t('select_file')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TAB: SHORTCUTS */}
            {activeTab === 'shortcuts' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('shortcuts')}</h3>
                  <p className="text-xs text-slate-500">{t('settings_shortcuts_desc')}</p>
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
                      {t('mouse_right_click')}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">{t('shortcut_right_click')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 shadow-2xs text-xs">
                      {t('mouse_double_click')}
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300">{t('shortcut_double_click')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. TAB: DIAGNOSTICS */}
            {activeTab === 'debug' && (
              <div className="flex flex-col gap-5 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('diagnostics')}</h3>
                  <p className="text-xs text-slate-500">{t('settings_diagnostics_desc')}</p>
                </div>

                {/* Live Storage Health Badge & Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t('diagnostics_engine_status')}</span>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={13} />
                      <span>{dbStats?.isConnected ? 'Online' : 'IndexedDB'}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t('diagnostics_total_records')}</span>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                      <Database size={13} className="text-blue-500" />
                      <span>{dbStats?.count ?? '~'}</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t('diagnostics_active_year')}</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {schoolYears.find(y => y.id === activeSchoolYearId)?.name || '—'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t('diagnostics_courses_count')}</span>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {subjectOrder.length}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col gap-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t('diagnostics_desc')}
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={async () => {
                        try {
                          const count = await db.store.count();
                          setDbStats({ isConnected: db.isOpen(), count });
                          showToast(`${t('db_status_connected')} (${count} ${t('db_status_records')})`, 'success');
                        } catch {
                          showToast(t('db_status_connected'), 'success');
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
                          showToast(t('diagnostics_downloaded'), 'info');
                        } else {
                          showToast(t('diagnostics_generating'), 'info');
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
