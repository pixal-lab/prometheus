import React, { useState, useMemo } from 'react';
import {
  GRADING_SYSTEMS,
  GradingSystemKey,
  generateGradingTable,
  splitIntoColumns,
  ScoreRow,
} from './utils/gradeFormulas';
import { QuickCalculator } from './components/QuickCalculator';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  Printer,
  Search,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  FileText,
  Flame,
  Star,
  Calculator,
  X,
} from 'lucide-react';
import { useTranslation } from '../../core/i18n/useTranslation';

export const ProofCorrectionPage: React.FC = () => {
  const { t } = useTranslation();

  // Generator State
  const [totalPoints, setTotalPoints] = useState<number>(() => {
    const saved = localStorage.getItem('prometheus_totalPoints');
    return saved ? parseFloat(saved) : 50;
  });
  const [passingPercentage, setPassingPercentage] = useState<number>(() => {
    const saved = localStorage.getItem('prometheus_passingPercentage');
    return saved ? parseFloat(saved) : 60;
  });
  const [system, setSystem] = useState<GradingSystemKey>(() => {
    const saved = localStorage.getItem('selectedGradingSystem') as GradingSystemKey;
    return saved || '7_0_chile';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Print Settings State (Persisted)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTitle, setPrintTitle] = useState(() => {
    return localStorage.getItem('prometheus_print_title') || 'Escala de Calificaciones';
  });
  const [printTeacher, setPrintTeacher] = useState(() => {
    return localStorage.getItem('prometheus_print_teacher') || '';
  });
  const [printSubject, setPrintSubject] = useState(() => {
    return localStorage.getItem('prometheus_print_subject') || '';
  });
  const [printCourse, setPrintCourse] = useState(() => {
    return localStorage.getItem('prometheus_print_course') || '';
  });
  const [printDate, setPrintDate] = useState(() => {
    return new Date().toLocaleDateString('es-CL');
  });
  const [printColumns, setPrintColumns] = useState<'auto' | '1' | '2' | '3' | '4'>(() => {
    return (localStorage.getItem('prometheus_print_columns') as 'auto' | '1' | '2' | '3' | '4') || 'auto';
  });
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(() => {
    return (localStorage.getItem('prometheus_print_sortOrder') as 'desc' | 'asc') || 'desc';
  });
  const [includePercentage, setIncludePercentage] = useState<boolean>(() => {
    const saved = localStorage.getItem('prometheus_print_includePercentage');
    return saved !== null ? saved === 'true' : true;
  });
  const [includeStatus, setIncludeStatus] = useState<boolean>(() => {
    const saved = localStorage.getItem('prometheus_print_includeStatus');
    return saved !== null ? saved === 'true' : true;
  });
  const [showHeaderFields, setShowHeaderFields] = useState<boolean>(() => {
    const saved = localStorage.getItem('prometheus_print_showHeaderFields');
    return saved !== null ? saved === 'true' : true;
  });
  const [printDensity, setPrintDensity] = useState<'compact' | 'normal'>(() => {
    return (localStorage.getItem('prometheus_print_density') as 'compact' | 'normal') || 'compact';
  });

  const handleSystemChange = (newSystem: GradingSystemKey) => {
    setSystem(newSystem);
    localStorage.setItem('selectedGradingSystem', newSystem);
  };

  const handleTotalPointsChange = (val: number) => {
    setTotalPoints(val);
    localStorage.setItem('prometheus_totalPoints', String(val));
  };

  const handlePercentageChange = (val: number) => {
    setPassingPercentage(val);
    localStorage.setItem('prometheus_passingPercentage', String(val));
  };

  // Calculations
  const tableData = useMemo(() => {
    return generateGradingTable(totalPoints > 0 ? totalPoints : 0, passingPercentage, system);
  }, [totalPoints, passingPercentage, system]);

  const passPointsThreshold = useMemo(() => {
    return Math.ceil((totalPoints * passingPercentage) / 100);
  }, [totalPoints, passingPercentage]);

  // Data for on-screen search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter(
      r => r.points.toString().includes(q) || r.grade.toLowerCase().includes(q)
    );
  }, [tableData, searchQuery]);

  // Data for printing (full table, optional sort order)
  const fullPrintData = useMemo(() => {
    if (sortOrder === 'asc') {
      return [...tableData].reverse();
    }
    return tableData;
  }, [tableData, sortOrder]);

  // Dynamic automatic column resolution
  const resolvedColumns = useMemo(() => {
    if (printColumns !== 'auto') {
      return parseInt(printColumns, 10);
    }
    if (totalPoints <= 20) return 2;
    if (totalPoints <= 55) return 3;
    return 4;
  }, [printColumns, totalPoints]);

  const printTableColumns = useMemo(() => {
    return splitIntoColumns(fullPrintData, resolvedColumns);
  }, [fullPrintData, resolvedColumns]);

  const systemName = useMemo(() => {
    return GRADING_SYSTEMS.find(s => s.id === system)?.name || system;
  }, [system]);

  const gradeRangeDisplay = useMemo(() => {
    return system === '7_0_chile'
      ? '1.0 — 7.0'
      : system === '10_0'
        ? '0.0 — 10.0'
        : system === 'gpa_value'
          ? '0.0 — 4.0'
          : 'F — A+';
  }, [system]);

  // Save print preferences
  const updatePrintPref = (key: string, val: string) => {
    localStorage.setItem(key, val);
  };

  const handlePrintNow = () => {
    setIsPrintModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const gridColClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  /**
   * Reusable Printable Sheet component
   * Renders the authentic, clean document both inside the Live Preview modal and on the actual printed paper
   */
  const renderPrintableDocument = (isPreview: boolean = false) => {
    return (
      <div
        className={`w-full text-slate-900 bg-white font-sans ${isPreview
            ? 'p-6 rounded-md shadow-sm border border-slate-200'
            : 'hidden print:block print:w-full print:p-0 print:m-0'
          }`}
      >
        {/* Document Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <Flame className="w-7 h-7 text-orange-600 fill-orange-500 shrink-0 select-none" />
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                {printTitle || t('scale_generator')}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Prometheus • Sistema de Evaluación y Corrección Escolar
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div className="font-bold text-slate-800">Fecha de Emisión:</div>
            <div className="font-mono text-slate-700">{printDate}</div>
          </div>
        </div>

        {/* Optional Teacher / Course / Subject Assessment Fields */}
        {showHeaderFields && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2.5 mb-3 bg-slate-50 border border-slate-300 rounded-lg text-xs">
            <div>
              <span className="font-bold text-slate-700">{t('teacher')}:</span>{' '}
              <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 pb-0.5 inline-block min-w-[90px]">
                {printTeacher || '_________________'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">{t('subject')}:</span>{' '}
              <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 pb-0.5 inline-block min-w-[90px]">
                {printSubject || '_________________'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">{t('grade_level')}:</span>{' '}
              <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 pb-0.5 inline-block min-w-[70px]">
                {printCourse || '____________'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-700">{t('date')}:</span>{' '}
              <span className="font-semibold text-slate-900 border-b border-dotted border-slate-400 pb-0.5 inline-block min-w-[70px]">
                {printDate || '____________'}
              </span>
            </div>
          </div>
        )}

        {/* Scale Parameters Summary Bar */}
        <div className="grid grid-cols-4 gap-2 mb-3 text-center text-xs">
          <div className="p-1.5 bg-slate-50 border border-slate-300 rounded">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              {t('total_score')}
            </div>
            <div className="text-sm font-black text-slate-900 font-mono">{totalPoints} pts</div>
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-300 rounded">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              {t('passing_percentage')}
            </div>
            <div className="text-sm font-black text-slate-900 font-mono">{passingPercentage}%</div>
          </div>
          <div className="p-1.5 bg-amber-50 border border-amber-300 rounded">
            <div className="text-[10px] text-amber-800 uppercase font-bold tracking-wider">
              {t('passing_cutoff')}
            </div>
            <div className="text-sm font-black text-amber-900 font-mono">
              {passPointsThreshold} pts
            </div>
          </div>
          <div className="p-1.5 bg-slate-50 border border-slate-300 rounded">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              {t('grading_system')}
            </div>
            <div className="text-sm font-black text-slate-900 truncate">{systemName}</div>
          </div>
        </div>

        {/* Multi-Column Table Layout */}
        <div className={`grid ${gridColClasses[resolvedColumns] || 'grid-cols-3'} gap-2.5 items-start`}>
          {printTableColumns.map((colRows: ScoreRow[], colIdx: number) => (
            <div
              key={colIdx}
              className="border border-slate-300 rounded-md overflow-hidden bg-white print-avoid-break"
            >
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-800 text-[10px] font-bold border-b border-slate-300 uppercase tracking-tight">
                  <tr>
                    <th className="py-1 px-1.5 text-center font-bold">{t('score')}</th>
                    {includePercentage && (
                      <th className="py-1 px-1 text-center font-bold">{t('percentage')}</th>
                    )}
                    <th className="py-1 px-1.5 text-center font-bold">{t('grade')}</th>
                    {includeStatus && (
                      <th className="py-1 px-1 text-center font-bold text-[9px]">{t('status')}</th>
                    )}
                  </tr>
                </thead>
                <tbody className={`divide-y divide-slate-200 ${printDensity === 'compact' ? 'text-[10px]' : 'text-xs'}`}>
                  {colRows.map(row => {
                    const isCutoff = row.points === passPointsThreshold;
                    return (
                      <tr
                        key={row.points}
                        className={`transition-none ${isCutoff
                            ? 'bg-amber-100/90 font-bold border-y-2 border-amber-600'
                            : row.points % 2 === 0
                              ? 'bg-slate-50/60'
                              : 'bg-white'
                          }`}
                      >
                        <td
                          className={`text-center font-mono font-bold text-slate-900 ${printDensity === 'compact' ? 'py-0.5 px-1.5' : 'py-1 px-2'
                            }`}
                        >
                          {row.points}
                        </td>
                        {includePercentage && (
                          <td
                            className={`text-center font-mono text-[9px] text-slate-600 ${printDensity === 'compact' ? 'py-0.5 px-1' : 'py-1 px-1.5'
                              }`}
                          >
                            {row.percentage}%
                          </td>
                        )}
                        <td
                          className={`text-center font-mono font-bold ${row.isPassing ? 'text-slate-900 font-extrabold' : 'text-rose-700 font-semibold'
                            } ${printDensity === 'compact' ? 'py-0.5 px-1.5' : 'py-1 px-2'}`}
                        >
                          {row.grade}
                        </td>
                        {includeStatus && (
                          <td
                            className={`text-center text-[9px] whitespace-nowrap ${printDensity === 'compact' ? 'py-0.5 px-1' : 'py-1 px-1.5'
                              }`}
                          >
                            {isCutoff ? (
                              <span className="font-extrabold text-amber-950 bg-amber-200/90 px-1 py-0.2 rounded text-[8px] uppercase tracking-tighter inline-flex items-center gap-0.5">
                                <Star size={8} className="fill-amber-950 text-amber-950 shrink-0" /> Corte
                              </span>
                            ) : row.isPassing ? (
                              <span className="text-emerald-700 font-semibold text-[8.5px]">Aprob</span>
                            ) : (
                              <span className="text-rose-600 font-normal text-[8.5px]">Reprob</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Print Footer */}
        <div className="mt-3 pt-2 border-t border-slate-300 text-[10px] text-slate-500 flex justify-between items-center">
          <span>
            Documento de Escala de Calificaciones • Prometheus ({totalPoints} puntos totales, rango {gradeRangeDisplay})
          </span>
          <span className="font-medium text-slate-700">
            Aprobación: {passPointsThreshold} pts ({passingPercentage}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* =========================================================================
          SCREEN INTERACTIVE VIEW (Hidden completely when printing via print:hidden)
          ========================================================================= */}
      <div className="flex flex-col gap-6 print:hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator size={26} className="text-orange-600 dark:text-orange-400" />
              <span>{t('proof_correction')}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('proof_correction_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setIsPrintModalOpen(true)}
              variant="primary"
              className="gap-2 shadow-xs"
              title="Configurar vista de impresión y exportar escala"
            >
              <Printer size={16} /> {t('print_table')}
            </Button>
            <Button
              onClick={handlePrintNow}
              variant="outline"
              className="gap-1.5"
              title="Impresión rápida directa a la impresora"
            >
              <Sparkles size={15} className="text-amber-500" /> {t('quick_print')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls and Calculator */}
          <div className="flex flex-col gap-6">
            {/* Settings Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wider">
                {t('scale_generator')}
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('total_score')}
                  type="number"
                  min={1}
                  max={500}
                  value={totalPoints}
                  onChange={e => handleTotalPointsChange(parseFloat(e.target.value) || 0)}
                />
                <Input
                  label={t('passing_percentage')}
                  type="number"
                  min={0}
                  max={100}
                  value={passingPercentage}
                  onChange={e => handlePercentageChange(parseFloat(e.target.value) || 0)}
                />
              </div>

              <Select
                label={t('grading_system')}
                value={system}
                onChange={e => handleSystemChange(e.target.value as GradingSystemKey)}
                options={GRADING_SYSTEMS.map(s => ({ value: s.id, label: s.name }))}
              />

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span>{t('pass_score_label')}</span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {passPointsThreshold} pts ({passingPercentage}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('grade_range_label')}</span>
                  <span className="font-semibold">{gradeRangeDisplay}</span>
                </div>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>{t('print_options')}</span>
              </button>
            </div>

            {/* Quick Calculator */}
            <div className="flex justify-center">
              <QuickCalculator />
            </div>
          </div>

          {/* Interactive Screen Table View */}
          <div className="lg:col-span-2 flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={t('search_score_ph')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredData.length} {t('records_count')}
                </span>
                <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50">
                  Corte: {passPointsThreshold} pts
                </span>
              </div>
            </div>

            {/* Scrollable table container for screen */}
            <div className="overflow-y-auto max-h-[600px] border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {t('score')}
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {t('percentage')}
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300">
                      {t('grade')}
                    </th>
                    <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-300 text-right">
                      {t('status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                        No se encontraron resultados para "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(row => {
                      const isCutoff = row.points === passPointsThreshold;
                      return (
                        <tr
                          key={row.points}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${isCutoff
                              ? 'bg-amber-50 dark:bg-amber-950/40 font-semibold border-y border-amber-300 dark:border-amber-700/60'
                              : ''
                            }`}
                        >
                          <td className="py-2 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                            {row.points}
                          </td>
                          <td className="py-2 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {row.percentage}%
                          </td>
                          <td className="py-2 px-4 font-mono font-bold text-base">
                            <span
                              className={
                                row.isPassing
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {row.grade}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            {isCutoff ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                <Star size={12} className="fill-amber-600 text-amber-600 dark:fill-amber-400 dark:text-amber-400" /> {t('passing_cutoff')}
                              </span>
                            ) : row.isPassing ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle size={12} /> {t('approved')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                                <XCircle size={12} /> {t('failed')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRINT PREVIEW & CONFIGURATION MODAL
          ========================================================================= */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={t('print_preview')}
        maxWidth="4xl"
      >
        <div className="flex flex-col gap-5">
          {/* Controls Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('evaluation_title')}
                </label>
                <input
                  type="text"
                  value={printTitle}
                  onChange={e => {
                    setPrintTitle(e.target.value);
                    updatePrintPref('prometheus_print_title', e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  placeholder="Escala de Calificaciones"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('teacher')}
                </label>
                <input
                  type="text"
                  value={printTeacher}
                  onChange={e => {
                    setPrintTeacher(e.target.value);
                    updatePrintPref('prometheus_print_teacher', e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  placeholder="Nombre del Docente"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('subject')}
                </label>
                <input
                  type="text"
                  value={printSubject}
                  onChange={e => {
                    setPrintSubject(e.target.value);
                    updatePrintPref('prometheus_print_subject', e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  placeholder="Asignatura"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('grade_level')}
                </label>
                <input
                  type="text"
                  value={printCourse}
                  onChange={e => {
                    setPrintCourse(e.target.value);
                    updatePrintPref('prometheus_print_course', e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  placeholder="Ej: 8° Básico A"
                />
              </div>
            </div>

            {/* Layout Customization Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('print_columns')}
                </label>
                <select
                  value={printColumns}
                  onChange={e => {
                    const val = e.target.value as 'auto' | '1' | '2' | '3' | '4';
                    setPrintColumns(val);
                    updatePrintPref('prometheus_print_columns', val);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="auto">Automático ({resolvedColumns} cols)</option>
                  <option value="1">1 Columna (Vertical)</option>
                  <option value="2">2 Columnas</option>
                  <option value="3">3 Columnas (Recomendado 30-60 pts)</option>
                  <option value="4">4 Columnas (Recomendado &gt;60 pts)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('sort_order')}
                </label>
                <select
                  value={sortOrder}
                  onChange={e => {
                    const val = e.target.value as 'desc' | 'asc';
                    setSortOrder(val);
                    updatePrintPref('prometheus_print_sortOrder', val);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="desc">{t('descending')}</option>
                  <option value="asc">{t('ascending')}</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('compact_density')}
                </label>
                <select
                  value={printDensity}
                  onChange={e => {
                    const val = e.target.value as 'compact' | 'normal';
                    setPrintDensity(val);
                    updatePrintPref('prometheus_print_density', val);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <option value="compact">Compacta (Ahorro de papel)</option>
                  <option value="normal">Normal (Fuente estándar)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {t('date')}
                </label>
                <input
                  type="text"
                  value={printDate}
                  onChange={e => setPrintDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showHeaderFields}
                  onChange={e => {
                    setShowHeaderFields(e.target.checked);
                    updatePrintPref('prometheus_print_showHeaderFields', String(e.target.checked));
                  }}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-slate-700 dark:text-slate-300">{t('show_header_fields')}</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includePercentage}
                  onChange={e => {
                    setIncludePercentage(e.target.checked);
                    updatePrintPref('prometheus_print_includePercentage', String(e.target.checked));
                  }}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-slate-700 dark:text-slate-300">{t('include_percentage')}</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeStatus}
                  onChange={e => {
                    setIncludeStatus(e.target.checked);
                    updatePrintPref('prometheus_print_includeStatus', String(e.target.checked));
                  }}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Mostrar estado (Aprob/Reprob)</span>
              </label>
            </div>
          </div>

          {/* Live Document Preview Box (Simulated Paper Sheet) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold">
                <FileText size={14} className="text-orange-500" /> Vista previa del papel ({fullPrintData.length} filas en {resolvedColumns} columnas)
              </span>
              <span>Distribución optimizada para 1 página</span>
            </div>

            <div className="bg-slate-200 dark:bg-slate-950 p-4 rounded-xl border border-slate-300 dark:border-slate-800 max-h-[460px] overflow-y-auto">
              {renderPrintableDocument(true)}
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={() => {
                setPrintTitle('Escala de Calificaciones');
                setPrintTeacher('');
                setPrintSubject('');
                setPrintCourse('');
                setPrintColumns('auto');
                setSortOrder('desc');
                setIncludePercentage(true);
                setIncludeStatus(true);
                setShowHeaderFields(true);
                setPrintDensity('compact');
              }}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-500"
            >
              <RotateCcw size={14} /> Restaurar valores
            </Button>

            <div className="flex items-center gap-2">
              <Button onClick={() => setIsPrintModalOpen(false)} variant="outline" size="sm">
                Cancelar
              </Button>
              <Button onClick={handlePrintNow} variant="primary" size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold">
                <Printer size={16} /> {t('print_now')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          AUTHENTIC PRINTABLE DOCUMENT (RENDERED ONLY TO THE PRINTER)
          ========================================================================= */}
      {renderPrintableDocument(false)}
    </>
  );
};
