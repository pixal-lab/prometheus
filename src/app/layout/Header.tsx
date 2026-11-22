import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Calculator,
  Moon,
  Sun,
  Globe,
  HardDrive,
  Cog,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useTheme } from '../../core/theme/useTheme';
import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';
import { CalendarExportService } from '../../features/calendar/services/calendarExportService';
import { BackupModal } from './BackupModal';
import { SettingsDrawer } from './SettingsDrawer';
import { reloadAllStores } from '../../core/storage/rehydrate';

export const Header: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { schoolYears, activeSchoolYearId, setActiveSchoolYear, classBlocks } = useCalendarStore();

  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeYear = schoolYears.find(y => y.id === activeSchoolYearId) || schoolYears[0];

  const navItems = [
    { to: '/', label: t('nav_calendar'), title: 'Calendario Escolar', icon: Calendar },
    { to: '/timetable', label: t('nav_timetable'), title: 'Horario Semanal', icon: Clock },
    { to: '/lesson-planner', label: t('nav_lesson_planner'), title: 'Planificador de Lecciones', icon: BookOpen },
    { to: '/gradebook', label: t('nav_gradebook'), title: 'Libro de Clases y Notas', icon: GraduationCap },
    { to: '/proof-correction', label: t('nav_proof_correction'), title: 'Escala de Calificaciones', icon: Calculator },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 select-none group">
            <span className="text-2xl filter drop-shadow-sm leading-none transition-transform group-hover:scale-110">
              🔥
            </span>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Prometheus
            </span>
          </NavLink>

          {/* Center Navigation Links: Clean segmented pill */}
          <nav className="hidden lg:flex items-center p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/80 shadow-2xs">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.title}
                  className={({ isActive }) =>
                    `h-8 px-3 rounded-xl text-xs font-bold whitespace-nowrap inline-flex items-center gap-2 transition-all select-none ${isActive
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-900/40'
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Controls: Harmonious h-9 heights and uniform icon sizes */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Active School Year Dropdown */}
            {schoolYears.length > 0 && (
              <div
                className="hidden sm:flex items-center h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold shadow-2xs gap-1.5 text-slate-700 dark:text-slate-200"
                title="Año Escolar Activo"
              >
                <Calendar size={15} className="text-orange-600 shrink-0" />
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Año:</span>
                <select
                  value={activeSchoolYearId || ''}
                  onChange={e => setActiveSchoolYear(Number(e.target.value))}
                  className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer font-bold pr-1 text-xs"
                >
                  {schoolYears.map(y => (
                    <option key={y.id} value={y.id} className="dark:bg-slate-900">
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportMenuOpen(prev => !prev)}
                className="h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                title="Exportar Calendario y Planes"
              >
                <Download size={15} className="text-orange-600 shrink-0" />
                <span className="hidden xl:inline">Exportar</span>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 select-none">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Calendario
                  </span>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      window.print();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileText size={15} className="text-rose-500 shrink-0" />
                    <span>Exportar Calendario PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportCalendarToExcel(classBlocks);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                    <span>Exportar Calendario Excel</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportCalendarToWord(classBlocks, activeYear);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileText size={15} className="text-blue-600 shrink-0" />
                    <span>Exportar Calendario Word</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Planes de Lección
                  </span>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportLessonPlansToWord(classBlocks);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileText size={15} className="text-blue-600 shrink-0" />
                    <span>Exportar Planes Word</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportCalendarToExcel(classBlocks, 'planes-de-leccion.csv');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                    <span>Exportar Planes Excel</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 dark:border-slate-800 mx-0.5 hidden sm:block" />

            {/* Utility Icon Buttons: Uniform h-9 w-9, rounded-xl, size={16} */}
            <button
              onClick={() => setIsBackupOpen(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 shadow-2xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Copias de Seguridad y Archivos Locales"
            >
              <HardDrive size={16} />
            </button>

            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="h-9 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs flex items-center gap-1.5 text-xs font-bold transition-colors uppercase cursor-pointer shrink-0"
              title={t('language')}
            >
              <Globe size={15} className="text-slate-400 shrink-0" />
              <span>{language}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 shadow-2xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 shadow-2xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Ajustes Generales y Periodos Escolares"
            >
              <Cog size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all select-none ${isActive
                    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon size={16} />
                <span className="whitespace-nowrap">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </header>

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataImported={reloadAllStores}
      />
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};
