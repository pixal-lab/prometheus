import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, id, ...props }) => {
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
        <input
          id={id}
          className={twMerge(
            clsx(
              'w-full py-2 text-xs sm:text-sm font-medium rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 shadow-2xs hover:border-orange-400 dark:hover:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all duration-150',
              icon ? 'pl-9 pr-3.5' : 'px-3.5',
              props.type === 'date' && 'cursor-pointer',
              error && 'border-red-500 focus:ring-red-500/40',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </div>
  );
};

