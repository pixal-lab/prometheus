import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Calculator,
  Cog,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Check,
  Flame,
} from 'lucide-react';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useCalendarStore } from '../../features/calendar/store/useCalendarStore';
import { CalendarExportService } from '../../features/calendar/services/calendarExportService';
import { SettingsModal } from './SettingsModal';
import { useSettingsModal } from '../../core/settings/useSettingsModal';
import { reloadAllStores } from '../../core/storage/rehydrate';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { schoolYears, activeSchoolYearId, setActiveSchoolYear, classBlocks } = useCalendarStore();
  const { isOpen: isSettingsOpen, activeTab: settingsSection, openSettings, closeSettings } = useSettingsModal();

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const yearMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (yearMenuRef.current && !yearMenuRef.current.contains(e.target as Node)) {
        setIsYearMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeYear = schoolYears.find(y => y.id === activeSchoolYearId) || schoolYears[0];

  const navItems = [
    { to: '/', label: t('nav_home'), title: t('title_home_nav'), icon: Home, end: true },
    { to: '/calendar', label: t('nav_calendar'), title: t('title_calendar_nav'), icon: Calendar },
    { to: '/timetable', label: t('nav_timetable'), title: t('title_timetable_nav'), icon: Clock },
    { to: '/lesson-planner', label: t('nav_lesson_planner'), title: t('title_planner_nav'), icon: BookOpen },
    { to: '/gradebook', label: t('nav_gradebook'), title: t('title_gradebook_nav'), icon: GraduationCap },
    { to: '/proof-correction', label: t('nav_proof_correction'), title: t('title_proof_nav'), icon: Calculator },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs print:hidden">
        <div className="max-w-[1700px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 select-none group">
            <Flame size={24} className="text-orange-600 fill-orange-500 transition-transform group-hover:scale-110 shrink-0" />
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Prometheus
            </span>
            <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase shadow-2xs">
              HUB
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
                  end={item.end}
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
            {/* Active School Year Dropdown (Custom styled popover menu) */}
            {schoolYears.length > 0 && (
              <div className="relative" ref={yearMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsYearMenuOpen(prev => !prev)}
                  className="h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-2xs inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                  title={t('school_year_active')}
                  aria-expanded={isYearMenuOpen}
                >
                  <Calendar size={15} className="text-orange-600 shrink-0" />
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider hidden md:inline">
                    {t('year_label')}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
                    {activeYear?.name || t('select_school_year')}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${isYearMenuOpen ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                {isYearMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100 select-none">
                    <div className="px-3 py-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t('school_years')}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {schoolYears.length} {schoolYears.length === 1 ? 'periodo' : 'periodos'}
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto px-1.5 py-1 flex flex-col gap-1">
                      {schoolYears.map(y => {
                        const isActive = y.id === activeSchoolYearId;
                        return (
                          <button
                            key={y.id}
                            type="button"
                            onClick={() => {
                              setActiveSchoolYear(y.id);
                              setIsYearMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${isActive
                                ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-900/60 shadow-2xs'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-transparent'
                              }`}
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-xs">{y.name}</span>
                              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                                {y.startDate} — {y.endDate}
                              </span>
                            </div>
                            {isActive && (
                              <span className="flex items-center gap-1 text-[10px] bg-orange-600 text-white font-semibold px-1.5 py-0.5 rounded-md shrink-0">
                                <Check size={12} /> {t('active')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1.5 px-1.5 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsYearMenuOpen(false);
                          openSettings('years');
                        }}
                        className="w-full px-2.5 py-1.5 text-left rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Cog size={14} className="text-orange-600 shrink-0" />
                        <span>{t('manage_years')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportMenuOpen(prev => !prev)}
                className="h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                title={t('export_calendar_plans')}
              >
                <Download size={15} className="text-orange-600 shrink-0" />
                <span className="hidden xl:inline">{t('export')}</span>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 select-none">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('calendar')}
                  </span>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      window.print();
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileText size={15} className="text-rose-500 shrink-0" />
                    <span>{t('export_calendar_pdf')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportCalendarToExcel(classBlocks);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                    <span>{t('export_calendar_excel')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportCalendarToWord(classBlocks, activeYear);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileText size={15} className="text-blue-600 shrink-0" />
                    <span>{t('export_calendar_word')}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t('lesson_plans_menu')}
                  </span>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportLessonPlansToWord(classBlocks);
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileText size={15} className="text-blue-600 shrink-0" />
                    <span>{t('export_plans_word')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      CalendarExportService.exportCalendarToExcel(classBlocks, 'planes-de-leccion.csv');
                    }}
                    className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
                    <span>{t('export_plans_excel')}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200 dark:border-slate-800 mx-0.5 hidden sm:block" />

            {/* Centralized Global Settings Button */}
            <button
              onClick={() => openSettings('general')}
              className="h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 shadow-2xs flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer shrink-0"
              title={t('title_settings')}
            >
              <Cog size={16} className="text-orange-600 shrink-0" />
              <span className="hidden sm:inline">{t('settings')}</span>
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
                end={item.end}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        initialSection={settingsSection}
        onDataImported={reloadAllStores}
      />
    </>
  );
};
