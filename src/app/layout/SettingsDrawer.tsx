import React, { useState } from 'react';
import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  X,
  Cog,
  Calendar,
  BookOpen,
  Keyboard,
  Activity,
  ChevronDown,
  ChevronUp,
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
  Compass,
} from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WEEKDAY_KEYS = [
  { code: 'L', label: 'Lun' },
  { code: 'M', label: 'Mar' },
  { code: 'X', label: 'Mié' },
  { code: 'J', label: 'Jue' },
  { code: 'V', label: 'Vie' },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

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
    setSubjectOrder,
    hemisphere,
    setHemisphere,
  } = useCalendarStore();

  const [expandedSection, setExpandedSection] = useState<'general' | 'years' | 'courses' | 'shortcuts' | 'debug'>('general');

  // Form states for new school year
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');

  // Form states for new course
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('#1abc9c');
  const [newCourseDays, setNewCourseDays] = useState<string[]>(['L', 'M', 'X', 'J', 'V']);

  if (!isOpen) return null;

  const toggleSection = (section: 'general' | 'years' | 'courses' | 'shortcuts' | 'debug') => {
    setExpandedSection(prev => (prev === section ? 'general' : section));
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim() || !newYearStart || !newYearEnd) {
      showToast('Por favor completa todos los campos del año escolar', 'warning');
      return;
    }
    await addSchoolYear({
      name: newYearName.trim(),
      startDate: newYearStart,
      endDate: newYearEnd,
    });
    setNewYearName('');
    setNewYearStart('');
    setNewYearEnd('');
    showToast('Año escolar añadido con éxito', 'success');
  };

  const handleDeleteYear = async (id: number, name: string) => {
    if (schoolYears.length <= 1) {
      showToast('No puedes eliminar el único año escolar', 'warning');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar el "${name}"?`)) {
      await deleteSchoolYear(id);
      showToast('Año escolar eliminado', 'info');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    await setSubject(newCourseName.trim(), {
      color: newCourseColor,
      visible: true,
      availableDays: newCourseDays.length > 0 ? newCourseDays : ['L', 'M', 'X', 'J', 'V'],
    });
    setNewCourseName('');
    setNewCourseDays(['L', 'M', 'X', 'J', 'V']);
    showToast('Curso creado con éxito', 'success');
  };

  const handleToggleCourseDay = (code: string) => {
    setNewCourseDays(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Cog className="text-orange-600 animate-spin-slow" size={20} />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('settings')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content with Accordion */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {/* 1. General Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('general')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Globe size={16} className="text-orange-600" /> General
              </span>
              {expandedSection === 'general' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSection === 'general' && (
              <div className="p-4 flex flex-col gap-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                {/* Language */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('language')}</span>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value as 'es' | 'en')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Hemisphere */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hemisferio Escolar</span>
                    <span className="text-[10px] text-slate-400">Define ciclo de fechas</span>
                  </div>
                  <select
                    value={hemisphere}
                    onChange={e => setHemisphere(e.target.value as 'south' | 'north')}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="south">Sur (Ene - Dic)</option>
                    <option value="north">Norte (Ago - Jul)</option>
                  </select>
                </div>

                {/* Theme */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Apariencia</span>
                  <Button onClick={toggleTheme} variant="outline" size="sm">
                    {theme === 'dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} />}
                    <span className="text-xs ml-1.5">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 2. School Years Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('years')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" /> Años Escolares
              </span>
              {expandedSection === 'years' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSection === 'years' && (
              <div className="p-4 flex flex-col gap-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                {/* List of existing years */}
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {schoolYears.map(year => {
                    const isActive = year.id === activeSchoolYearId;
                    return (
                      <div
                        key={year.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                          isActive
                            ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/30'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                            {year.name}
                            {isActive && (
                              <span className="bg-orange-600 text-white text-[9px] px-1.5 py-0.2 rounded font-mono font-normal">
                                Activo
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {year.startDate} al {year.endDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {!isActive && (
                            <button
                              onClick={() => setActiveSchoolYear(year.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950 rounded transition-colors"
                              title="Establecer como año activo"
                            >
                              Activar
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteYear(year.id, year.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Eliminar año"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Form to add new school year */}
                <form onSubmit={handleAddYear} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Añadir Nuevo Año Escolar</span>
                  <input
                    type="text"
                    placeholder="Nombre (ej: Año 2027-2028)"
                    value={newYearName}
                    onChange={e => setNewYearName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Inicio:</span>
                      <input
                        type="date"
                        value={newYearStart}
                        onChange={e => setNewYearStart(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400">Fin:</span>
                      <input
                        type="date"
                        value={newYearEnd}
                        onChange={e => setNewYearEnd(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="mt-1">
                    <Plus size={14} /> Añadir Año Escolar
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* 3. Courses Section with Drag/Sort Order & Available Days */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('courses')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-600" /> Cursos y Asignaturas
              </span>
              {expandedSection === 'courses' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSection === 'courses' && (
              <div className="p-4 flex flex-col gap-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                {/* List of courses */}
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                  {subjectOrder.map((name, index) => {
                    const conf = subjects[name];
                    if (!conf) return null;
                    return (
                      <div
                        key={name}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs bg-slate-50/50 dark:bg-slate-900/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="color"
                            value={conf.color}
                            onChange={e => setSubject(name, { ...conf, color: e.target.value })}
                            className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className={`font-semibold truncate ${conf.visible ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 line-through'}`}>
                              {name}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              Días: {(conf.availableDays || ['L','M','X','J','V']).join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveCourseOrder(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                            title="Subir posición"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            onClick={() => handleMoveCourseOrder(index, 'down')}
                            disabled={index === subjectOrder.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                            title="Bajar posición"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            onClick={() => setSubject(name, { ...conf, visible: !conf.visible })}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title={conf.visible ? 'Ocultar' : 'Mostrar'}
                          >
                            {conf.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar curso "${name}"?`)) deleteSubject(name);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Eliminar curso"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Form to add course */}
                <form onSubmit={handleAddCourse} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Crear Nuevo Curso</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nombre (ej: Filosofía)"
                      value={newCourseName}
                      onChange={e => setNewCourseName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      required
                    />
                    <input
                      type="color"
                      value={newCourseColor}
                      onChange={e => setNewCourseColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-900 p-0.5"
                    />
                  </div>

                  {/* Day selection */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">Días en que se imparte:</span>
                    <div className="flex items-center gap-1.5">
                      {WEEKDAY_KEYS.map(day => {
                        const isSelected = newCourseDays.includes(day.code);
                        return (
                          <button
                            key={day.code}
                            type="button"
                            onClick={() => handleToggleCourseDay(day.code)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
                              isSelected
                                ? 'bg-orange-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Button type="submit" variant="primary" size="sm" className="mt-1">
                    <Plus size={14} /> Crear Curso
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* 4. Keyboard Shortcuts Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('shortcuts')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Keyboard size={16} className="text-amber-600" /> Atajos de Teclado
              </span>
              {expandedSection === 'shortcuts' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSection === 'shortcuts' && (
              <div className="p-4 flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-orange-600">Ctrl + Z</span>
                  <span>Deshacer última acción</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-orange-600">Ctrl + Y</span>
                  <span>Rehacer acción revertida</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">Clic Derecho</span>
                  <span>Menú contextual rápido de evento</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">Doble Clic</span>
                  <span>Abre edición directa</span>
                </div>
              </div>
            )}
          </div>

          {/* 5. Diagnostics Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('debug')}
              className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 font-semibold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Activity size={16} className="text-purple-600" /> Diagnóstico y Salud
              </span>
              {expandedSection === 'debug' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSection === 'debug' && (
              <div className="p-4 flex flex-col gap-3 text-xs bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <p className="text-slate-500 text-[11px]">
                  Verifica el estado del motor IndexedDB (Dexie) y genera reportes para soporte técnico.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={async () => {
                      if ((window as any).__PROMETHEUS_DEBUG__) {
                        const res = await (window as any).__PROMETHEUS_DEBUG__.healthCheck();
                        showToast(`IndexedDB Conectado (${res.count} registros)`, 'success');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Chequeo de Salud
                  </Button>
                  <Button
                    onClick={async () => {
                      if ((window as any).__PROMETHEUS_DEBUG__) {
                        await (window as any).__PROMETHEUS_DEBUG__.exportDiagnosticReport();
                        showToast('Reporte descargado', 'info');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Descargar Reporte
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
