import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, children, className, id, ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}
      <select
        id={id}
        className={twMerge(
          clsx(
            'w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors cursor-pointer',
            error && 'border-red-500 focus:ring-red-500',
            className
          )
        )}
        {...props}
      >
        {options
          ? options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

