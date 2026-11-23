import React, { useState } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../core/i18n/useTranslation';

export const QuickCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [display, setDisplay] = useState('0');
  const [firstOperand, setFirstOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleNumber = (digit: string) => {
    if (justEvaluated) {
      setDisplay(digit === '.' ? '0.' : digit);
      setJustEvaluated(false);
      setWaitingForSecond(false);
      return;
    }
    if (waitingForSecond) {
      setDisplay(digit === '.' ? '0.' : digit);
      setWaitingForSecond(false);
    } else {
      if (digit === '.' && display.includes('.')) return;
      setDisplay(display === '0' && digit !== '.' ? digit : display + digit);
    }
  };

  const handleOperator = (nextOp: string) => {
    setJustEvaluated(false);
    const inputVal = parseFloat(display);

    if (operator && waitingForSecond) {
      setOperator(nextOp);
      return;
    }

    if (firstOperand === null) {
      setFirstOperand(inputVal);
    } else if (operator) {
      const result = compute(firstOperand, inputVal, operator);
      setDisplay(String(result));
      setFirstOperand(result);
    }

    setOperator(nextOp);
    setWaitingForSecond(true);
  };

  const compute = (a: number, b: number, op: string): number => {
    let res: number;
    switch (op) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '×': res = a * b; break;
      case '÷': res = b !== 0 ? a / b : 0; break;
      default: return b;
    }
    return Math.round(res * 1000000) / 1000000;
  };

  const handleEquals = () => {
    if (firstOperand === null || operator === null) return;
    const inputVal = parseFloat(display);
    const result = compute(firstOperand, inputVal, operator);
    setDisplay(String(result));
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
    setJustEvaluated(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecond(false);
    setJustEvaluated(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm w-full max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('calculator')}</span>
        <button
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
        >
          <RotateCcw size={12} /> {t('clear_calc')}
        </button>
      </div>

      <div className="bg-slate-100 dark:bg-slate-950 rounded-xl p-3 mb-4 text-right">
        <span className="text-2xl font-mono font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate block">
          {display}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={handleClear} className="btn-calc col-span-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          AC
        </button>
        <button onClick={handleBackspace} className="btn-calc bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
          <Delete size={16} />
        </button>
        <button onClick={() => handleOperator('÷')} className="btn-calc bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold">
          ÷
        </button>

        {['7', '8', '9'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="btn-calc">
            {n}
          </button>
        ))}
        <button onClick={() => handleOperator('×')} className="btn-calc bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold">
          ×
        </button>

        {['4', '5', '6'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="btn-calc">
            {n}
          </button>
        ))}
        <button onClick={() => handleOperator('-')} className="btn-calc bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold">
          -
        </button>

        {['1', '2', '3'].map(n => (
          <button key={n} onClick={() => handleNumber(n)} className="btn-calc">
            {n}
          </button>
        ))}
        <button onClick={() => handleOperator('+')} className="btn-calc bg-orange-100 dark:bg-orange-950/60 text-orange-600 font-bold">
          +
        </button>

        <button onClick={() => handleNumber('0')} className="btn-calc col-span-2">
          0
        </button>
        <button onClick={() => handleNumber('.')} className="btn-calc">
          .
        </button>
        <button onClick={handleEquals} className="btn-calc bg-orange-600 text-white font-bold hover:bg-orange-700">
          =
        </button>
      </div>

      <style>{`
        .btn-calc {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.65rem;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 0.75rem;
          transition: background-color 0.15s;
          cursor: pointer;
        }
        .btn-calc:not(.bg-orange-600):not(.bg-orange-100):not(.bg-slate-200) {
          background-color: #f1f5f9;
          color: #1e293b;
        }
        :global(.dark) .btn-calc:not(.bg-orange-600):not(.bg-orange-100):not(.bg-slate-200) {
          background-color: #1e293b;
          color: #f8fafc;
        }
        .btn-calc:hover {
          filter: brightness(0.95);
        }
      `}</style>
    </div>
  );
};

