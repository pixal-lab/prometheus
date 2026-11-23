import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  children,
  className,
  id,
  icon,
  ...props
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <select
          id={id}
          className={twMerge(
            clsx(
              'w-full appearance-none py-2 text-xs sm:text-sm font-semibold rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs hover:border-orange-400 dark:hover:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all cursor-pointer',
              icon ? 'pl-9 pr-9' : 'pl-3.5 pr-9',
              error && 'border-red-500 focus:ring-red-500/40',
              className
            )
          )}
          {...props}
        >
          {options
            ? options.map(opt => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 py-1.5"
                >
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500">
          <ChevronDown size={14} className="shrink-0" />
        </div>
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
};
