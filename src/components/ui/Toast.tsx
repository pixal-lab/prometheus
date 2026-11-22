import React from 'react';
import { create } from 'zustand';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { ToastMessage } from '../../core/types/common.types';

interface ToastStore {
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],
  showToast: (message: string, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, message, type };
    set({ toasts: [...get().toasts, newToast] });

    setTimeout(() => {
      get().removeToast(id);
    }, 3500);
  },
  removeToast: (id: string) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },
}));

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const icons = {
    info: <Info className="text-blue-500 shrink-0" size={18} />,
    success: <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />,
    warning: <AlertTriangle className="text-amber-500 shrink-0" size={18} />,
    error: <XCircle className="text-rose-500 shrink-0" size={18} />,
  };

  const borders = {
    info: 'border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/80 text-blue-950 dark:text-blue-100',
    success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100',
    warning: 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100',
    error: 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${borders[toast.type]}`}
        >
          <div className="flex items-center gap-2.5">
            {icons[toast.type]}
            <p className="text-sm font-medium leading-tight">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

