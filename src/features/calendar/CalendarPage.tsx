import React, { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useCalendarStore, CalendarViewType } from './store/useCalendarStore';

dayjs.extend(isoWeek);
import { MonthView } from './components/views/MonthView';
import { WeekView } from './components/views/WeekView';
import { DayView } from './components/views/DayView';
import { QuarterView } from './components/views/QuarterView';
import { SemesterView } from './components/views/SemesterView';
import { YearView } from './components/views/YearView';
import { AgendaView } from './components/views/AgendaView';
import { EventModal } from './components/EventModal';
import { DayTypeModal } from './components/DayTypeModal';
import { CopyMoveYearModal } from './components/CopyMoveYearModal';
import { ContextMenu } from './components/ContextMenu';
import { MoveSubjectModal } from './components/MoveSubjectModal';
import { MoveConflictModal } from './components/MoveConflictModal';
import { Button } from '../../components/ui/Button';
import { ClassBlock } from '../../core/types/calendar.types';
import { expandRecurringEvents } from './utils/recurrenceEngine';
import { CalendarExportService } from './services/calendarExportService';
import { useSettingsModal } from '../../core/settings/useSettingsModal';
import { useToast } from '../../components/ui/Toast';
import { useDialog } from '../../components/ui/Dialog';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Undo2,
  Redo2,
  Palette,
  CalendarDays,
  Printer,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from '../../core/i18n/useTranslation';

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { confirm } = useDialog();
  const { openSettings } = useSettingsModal();
  const {
    classBlocks,
    subjects,
    calendarDayTypes,
    schoolYears,
    activeSchoolYearId,
    currentView,
    currentDate,
    setCurrentView,
    navigateDate,
    undo,
    redo,
    undoStack,
    redoStack,
    loadData,
    isLoading,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    rescheduleBlock,
    pushEventsInCascade,
  } = useCalendarStore();

  const [activeEvent, setActiveEvent] = useState<ClassBlock | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDayForAdd, setSelectedDayForAdd] = useState<string | undefined>(undefined);

  const [activeDateForDayType, setActiveDateForDayType] = useState<string | null>(null);
  const [isCopyMoveModalOpen, setIsCopyMoveModalOpen] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    event: ClassBlock;
  } | null>(null);

  // Move subject modal state
  const [moveSubjectModal, setMoveSubjectModal] = useState<{
    isOpen: boolean;
    subject: string;
  }>({ isOpen: false, subject: '' });

  // Conflict modal state
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    blockId: string;
    topic: string;
    targetDate: string;
    daysDiff: number;
  }>({ isOpen: false, blockId: '', topic: '', targetDate: '', daysDiff: 0 });

  // Export menu dropdown state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global keyboard shortcuts: Ctrl+Z and Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Expand recurring events for the visible range
  const expandedBlocks = useMemo(() => {
    const cur = dayjs(currentDate);
    const rangeStart = cur.subtract(2, 'month').format('YYYY-MM-DD');
    const rangeEnd = cur.add(2, 'month').format('YYYY-MM-DD');
    return expandRecurringEvents(classBlocks, rangeStart, rangeEnd);
  }, [classBlocks, currentDate]);

  const VIEW_TABS: { id: CalendarViewType; labelKey: string }[] = [
    { id: 'day', labelKey: 'view_day' },
    { id: 'week', labelKey: 'view_week' },
    { id: 'month', labelKey: 'view_month' },
    { id: 'quarter', labelKey: 'view_quarter' },
    { id: 'semester', labelKey: 'view_semester' },
    { id: 'year', labelKey: 'view_year' },
    { id: 'agenda', labelKey: 'view_agenda' },
  ];

  const viewTitle = useMemo(() => {
    const cur = dayjs(currentDate);
    if (currentView === 'day') {
      return cur.locale() === 'es'
        ? cur.format('dddd, DD [de] MMMM [de] YYYY')
        : cur.format('dddd, MMMM DD, YYYY');
    }
    if (currentView === 'week') {
      const mon = cur.startOf('isoWeek');
      const fri = mon.add(4, 'day');
      return `${t('week_prefix')} ${mon.format('DD')} - ${fri.format('DD MMMM YYYY')}`;
    }
    if (currentView === 'quarter') {
      const q = Math.floor(cur.month() / 3) + 1;
      return `${t('quarter_prefix')} ${q} - ${cur.year()}`;
    }
    if (currentView === 'semester') {
      const sem = cur.month() < 6 ? 1 : 2;
      return `${t('semester_prefix')} ${sem} - ${cur.year()}`;
    }
    if (currentView === 'year') {
      return `${t('year_prefix')} ${cur.year()}`;
    }
    return cur.format('MMMM YYYY');
  }, [currentDate, currentView, t]);

  const handleEventClick = (event: ClassBlock) => {
    setActiveEvent(event);
    setSelectedDayForAdd(event.date);
    setIsEventModalOpen(true);
  };

  const handleAddEventClick = (date: string) => {
    setActiveEvent(null);
    setSelectedDayForAdd(date);
    setIsEventModalOpen(true);
  };

  const handleDayClick = (date: string) => {
    setActiveDateForDayType(date);
  };

  const handleContextMenu = (e: React.MouseEvent, block: ClassBlock) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      event: block,
    });
  };

  const handleDropBlock = async (blockId: string, targetDate: string) => {
    const isRecurringInstance = blockId.includes('-rec-');
    const baseId = isRecurringInstance ? blockId.replace(/-rec-\d+$/, '') : blockId;
    const block = classBlocks.find(b => b.id === baseId);
    if (!block) return;

    if (isRecurringInstance) {
      await addBlock({
        ...block,
        topic: `${block.topic}`,
        date: targetDate,
        isRecurring: false,
        recurrenceRule: undefined,
      });
      showToast(`Ocurrencia movida al ${targetDate} como clase independiente`, 'info');
      return;
    }

    if (block.date === targetDate) return;

    // Check if there is already a block on targetDate
    const hasConflict = classBlocks.some(b => b.date === targetDate && b.id !== blockId);
    
    // Calculate difference in school weekdays (Mon-Fri) for accurate cascade shifting
    let weekdaysCount = 0;
    const startD = dayjs(block.date);
    const endD = dayjs(targetDate);
    if (!startD.isSame(endD, 'day')) {
      const step = endD.isAfter(startD) ? 1 : -1;
      let cur = startD;
      while (!cur.isSame(endD, 'day')) {
        cur = cur.add(step, 'day');
        if (cur.isoWeekday() <= 5) {
          weekdaysCount += step;
        }
      }
    }

    if (hasConflict) {
      setConflictModal({
        isOpen: true,
        blockId,
        topic: block.topic,
        targetDate,
        daysDiff: weekdaysCount,
      });
    } else {
      await moveBlock(blockId, targetDate);
      showToast(`Clase movida al ${targetDate}`, 'info');
    }
  };

  const handleReschedule = async (block: ClassBlock, cascade: boolean) => {
    await rescheduleBlock(block.id, cascade);
    showToast(
      cascade
        ? 'Clase y posteriores reagendadas en cascada'
        : 'Clase reagendada a la siguiente fecha disponible',
      'success'
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-slate-400">Cargando calendario y eventos...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('month_prev')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => navigateDate('today')}
              className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-orange-600 transition-colors"
            >
              {t('today')}
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('month_next')}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 className="text-xl font-bold capitalize text-slate-900 dark:text-slate-100">
            {viewTitle}
          </h2>
        </div>

        {/* View Switcher, Undo/Redo & Actions */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Undo / Redo */}
          <div className="flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs mr-1">
            <button
              onClick={undo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Ctrl + Z"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Ctrl + Y"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold gap-0.5 overflow-x-auto">
            {VIEW_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${currentView === tab.id
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* Action Modals */}
          <Button onClick={() => openSettings('courses')} variant="outline" size="sm" title={t('subject_mgmt_title')}>
            <Palette size={15} /> {t('subjects_btn')}
          </Button>

          <Button onClick={() => setIsCopyMoveModalOpen(true)} variant="outline" size="sm" title={t('copy_move_year')}>
            <Copy size={15} /> {t('school_years_btn')}
          </Button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(prev => !prev)}
              className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer"
              title={t('export_calendar_plans')}
              aria-expanded={isExportMenuOpen}
            >
              <Download size={14} className="text-orange-600 shrink-0" />
              <span>{t('export_btn')}</span>
              <ChevronDown
                size={13}
                className={`text-slate-400 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 select-none">
                <span className="px-2.5 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('calendar')}
                </span>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    window.print();
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <Printer size={14} className="text-orange-600 shrink-0" />
                  <span>{t('print_pdf')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    const activeYear = schoolYears.find(y => y.id === activeSchoolYearId) || schoolYears[0];
                    CalendarExportService.exportCalendarToWord(classBlocks, activeYear);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <FileText size={14} className="text-blue-600 shrink-0" />
                  <span>{t('cal_word')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    CalendarExportService.exportCalendarToExcel(classBlocks);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600 shrink-0" />
                  <span>{t('cal_excel')}</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <span className="px-2.5 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('lesson_plans_menu')}
                </span>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    CalendarExportService.exportLessonPlansToWord(classBlocks);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <FileText size={14} className="text-indigo-600 shrink-0" />
                  <span>{t('plans_word')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    CalendarExportService.exportCalendarToExcel(classBlocks, 'planes-de-leccion.csv');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl text-left flex items-center gap-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet size={14} className="text-teal-600 shrink-0" />
                  <span>{t('plans_excel')}</span>
                </button>
              </div>
            )}
          </div>

          <Button
            onClick={() => handleAddEventClick(currentDate)}
            variant="primary"
            size="sm"
          >
            <Plus size={15} /> {t('create_event')}
          </Button>
        </div>
      </div>

      {/* Active Calendar View */}
      {currentView === 'month' && (
        <MonthView
          currentDate={currentDate}
          blocks={expandedBlocks}
          subjects={subjects}
          dayTypes={calendarDayTypes}
          onEventClick={handleEventClick}
          onAddEventClick={handleAddEventClick}
          onDayClick={handleDayClick}
          onContextMenu={handleContextMenu}
          onDropBlock={handleDropBlock}
        />
      )}

      {currentView === 'week' && (
        <WeekView
          currentDate={currentDate}
          blocks={expandedBlocks}
          subjects={subjects}
          dayTypes={calendarDayTypes}
          onEventClick={handleEventClick}
          onAddEventClick={handleAddEventClick}
          onDayClick={handleDayClick}
          onContextMenu={handleContextMenu}
          onDropBlock={handleDropBlock}
        />
      )}

      {currentView === 'day' && (
        <DayView
          currentDate={currentDate}
          blocks={expandedBlocks}
          subjects={subjects}
          dayTypes={calendarDayTypes}
          onEventClick={handleEventClick}
          onAddEventClick={handleAddEventClick}
          onDayClick={handleDayClick}
          onContextMenu={handleContextMenu}
        />
      )}

      {currentView === 'quarter' && (
        <QuarterView
          currentDate={currentDate}
          blocks={expandedBlocks}
          subjects={subjects}
          dayTypes={calendarDayTypes}
          onEventClick={handleEventClick}
          onAddEventClick={handleAddEventClick}
          onDayClick={handleDayClick}
        />
      )}

      {currentView === 'semester' && (
        <SemesterView
          currentDate={currentDate}
          blocks={expandedBlocks}
          subjects={subjects}
          dayTypes={calendarDayTypes}
          onEventClick={handleEventClick}
          onAddEventClick={handleAddEventClick}
          onDayClick={handleDayClick}
        />
      )}

      {currentView === 'year' && (
        <YearView
          currentDate={currentDate}
          blocks={expandedBlocks}
          subjects={subjects}
          dayTypes={calendarDayTypes}
          onEventClick={handleEventClick}
          onAddEventClick={handleAddEventClick}
          onDayClick={handleDayClick}
        />
      )}

      {currentView === 'agenda' && (
        <AgendaView
          currentDate={currentDate}
          blocks={expandedBlocks}
          subjects={subjects}
          onEventClick={handleEventClick}
        />
      )}

      {/* Modals */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setActiveEvent(null);
        }}
        event={activeEvent}
        defaultDate={selectedDayForAdd}
      />

      {activeDateForDayType && (
        <DayTypeModal
          isOpen={!!activeDateForDayType}
          onClose={() => setActiveDateForDayType(null)}
          date={activeDateForDayType}
        />
      )}

      <CopyMoveYearModal
        isOpen={isCopyMoveModalOpen}
        onClose={() => setIsCopyMoveModalOpen(false)}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          event={contextMenu.event}
          onClose={() => setContextMenu(null)}
          onEdit={(event) => {
            handleEventClick(event);
            setContextMenu(null);
          }}
          onReschedule={(event, cascade) => {
            handleReschedule(event, cascade);
            setContextMenu(null);
          }}
          onMoveSubject={(subject) => {
            setMoveSubjectModal({ isOpen: true, subject });
            setContextMenu(null);
          }}
          onDelete={async (event) => {
            const isRecurringInstance = event.id.includes('-rec-');
            const baseId = isRecurringInstance ? event.id.replace(/-rec-\d+$/, '') : event.id;
            if (isRecurringInstance) {
              const confirmed = await confirm({
                title: 'Eliminar Serie Recurrente',
                message: 'Esta clase forma parte de una repetición. ¿Deseas eliminar la serie completa?',
                confirmText: 'Eliminar Serie',
                variant: 'danger',
                icon: 'trash',
              });
              if (confirmed) {
                await deleteBlock(baseId);
                showToast('Serie de clases eliminada', 'info');
              }
            } else {
              const confirmed = await confirm({
                title: 'Eliminar Clase',
                message: `¿Deseas eliminar la clase "${event.topic || event.subject}"?`,
                confirmText: 'Eliminar',
                variant: 'danger',
                icon: 'trash',
              });
              if (confirmed) {
                await deleteBlock(event.id);
                showToast('Clase eliminada', 'info');
              }
            }
            setContextMenu(null);
          }}
          onViewLessonPlan={(event) => {
            handleEventClick(event);
            setContextMenu(null);
          }}
        />
      )}

      {moveSubjectModal.isOpen && (
        <MoveSubjectModal
          isOpen={moveSubjectModal.isOpen}
          onClose={() => setMoveSubjectModal({ isOpen: false, subject: '' })}
          subject={moveSubjectModal.subject}
        />
      )}

      {conflictModal.isOpen && (
        <MoveConflictModal
          isOpen={conflictModal.isOpen}
          onClose={() => setConflictModal(prev => ({ ...prev, isOpen: false }))}
          topic={conflictModal.topic}
          targetDate={conflictModal.targetDate}
          onMoveSingle={async () => {
            await moveBlock(conflictModal.blockId, conflictModal.targetDate);
            showToast(`Clase movida al ${conflictModal.targetDate}`, 'info');
          }}
          onMoveCascade={async () => {
            await pushEventsInCascade(conflictModal.blockId, conflictModal.daysDiff);
            showToast('Clases desplazadas en cascada', 'success');
          }}
        />
      )}
    </div>
  );
};

