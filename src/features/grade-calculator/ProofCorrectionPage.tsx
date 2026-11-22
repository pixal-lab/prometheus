import React, { useState, useMemo } from 'react';
import { GRADING_SYSTEMS, GradingSystemKey, generateGradingTable } from './utils/gradeFormulas';
import { QuickCalculator } from './components/QuickCalculator';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Printer, Search, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '../../core/i18n/useTranslation';

export const ProofCorrectionPage: React.FC = () => {
  const { t } = useTranslation();
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

  const tableData = useMemo(() => {
    return generateGradingTable(totalPoints > 0 ? totalPoints : 0, passingPercentage, system);
  }, [totalPoints, passingPercentage, system]);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    const q = searchQuery.toLowerCase();
    return tableData.filter(
      r => r.points.toString().includes(q) || r.grade.toLowerCase().includes(q)
    );
  }, [tableData, searchQuery]);

  const passPointsThreshold = useMemo(() => {
    return Math.ceil((totalPoints * passingPercentage) / 100);
  }, [totalPoints, passingPercentage]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            ✏️ {t('proof_correction')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculadora y tabla de escalas de notas punto a punto para evaluaciones escolares.
          </p>
        </div>

        <Button onClick={() => window.print()} variant="outline" className="print:hidden">
          <Printer size={16} /> {t('print_table')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls and Calculator */}
        <div className="flex flex-col gap-6 print:hidden">
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
                <span>Puntaje de Aprobación:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {passPointsThreshold} pts ({passingPercentage}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rango de Notas:</span>
                <span className="font-semibold">
                  {system === '7_0_chile' ? '1.0 — 7.0' : system === '10_0' ? '0.0 — 10.0' : system === 'gpa_value' ? '0.0 — 4.0' : 'F — A+'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Calculator */}
          <div className="flex justify-center">
            <QuickCalculator />
          </div>
        </div>

        {/* Table View */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4 print:hidden">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar puntaje o nota..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {filteredData.length} registros
            </span>
          </div>

          <div className="overflow-y-auto max-h-[600px] border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 border-b border-slate-200 dark:border-slate-800">
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
                {filteredData.map(row => (
                  <tr
                    key={row.points}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      row.points === passPointsThreshold
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 font-semibold'
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
                      {row.isPassing ? (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

