import React, { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import {
  AlertTriangle,
  Trash2,
  HelpCircle,
  Info,
  FolderPlus,
  FileText,
  Edit2,
  Bookmark,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import { Button } from './Button';
import { useTranslation } from '../../core/i18n/useTranslation';

export interface ConfirmOptions {
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'info';
  icon?: 'trash' | 'warning' | 'info' | 'help';
}

export interface PromptOptions {
  title: string;
  message?: string | React.ReactNode;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  icon?: 'edit' | 'folder' | 'lesson' | 'template' | 'plus';
  inputType?: 'text' | 'number';
}

export interface AlertOptions {
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

interface DialogState {
  isOpen: boolean;
  type: 'confirm' | 'prompt' | 'alert' | null;
  title: string;
  message?: string | React.ReactNode;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'info' | 'success' | 'error';
  icon?: string;
  inputType?: 'text' | 'number';
  resolve?: (value: any) => void;

  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  alert: (options: AlertOptions) => Promise<void>;
  close: (value: any) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  isOpen: false,
  type: null,
  title: '',
  message: '',
  placeholder: '',
  defaultValue: '',
  confirmText: '',
  cancelText: '',
  variant: 'primary',
  icon: undefined,
  inputType: 'text',
  resolve: undefined,

  confirm: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        type: 'confirm',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || useTranslation.getState().t('confirm', 'Confirmar'),
        cancelText: options.cancelText || useTranslation.getState().t('cancel', 'Cancelar'),
        variant: options.variant || (options.icon === 'trash' ? 'danger' : 'primary'),
        icon: options.icon || (options.variant === 'danger' ? 'trash' : 'warning'),
        resolve: (val: boolean) => {
          resolve(val);
          set({ isOpen: false, type: null, resolve: undefined });
        },
      });
    });
  },

  prompt: (options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      set({
        isOpen: true,
        type: 'prompt',
        title: options.title,
        message: options.message,
        placeholder: options.placeholder || '',
        defaultValue: options.defaultValue || '',
        confirmText: options.confirmText || useTranslation.getState().t('save', 'Guardar'),
        cancelText: options.cancelText || useTranslation.getState().t('cancel', 'Cancelar'),
        variant: options.variant || 'primary',
        icon: options.icon || 'edit',
        inputType: options.inputType || 'text',
        resolve: (val: string | null) => {
          resolve(val);
          set({ isOpen: false, type: null, resolve: undefined });
        },
      });
    });
  },

  alert: (options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      set({
        isOpen: true,
        type: 'alert',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || useTranslation.getState().t('understood', 'Entendido'),
        variant: options.variant || 'info',
        icon: 'info',
        resolve: () => {
          resolve();
          set({ isOpen: false, type: null, resolve: undefined });
        },
      });
    });
  },

  close: (value: any) => {
    const { resolve, type } = get();
    if (resolve) {
      if (type === 'confirm') {
        resolve(Boolean(value));
      } else if (type === 'prompt') {
        resolve(value !== undefined ? value : null);
      } else {
        resolve(undefined);
      }
    }
    set({ isOpen: false, type: null, resolve: undefined });
  },
}));

export const useDialog = () => {
  const confirm = useDialogStore((s) => s.confirm);
  const prompt = useDialogStore((s) => s.prompt);
  const alert = useDialogStore((s) => s.alert);
  return { confirm, prompt, alert };
};

export const DialogContainer: React.FC = () => {
  const {
    isOpen,
    type,
    title,
    message,
    placeholder,
    defaultValue,
    confirmText,
    cancelText,
    variant,
    icon,
    inputType,
    close,
  } = useDialogStore();

  const [inputVal, setInputVal] = useState(defaultValue || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputVal(defaultValue || '');
      // Focus and select input if prompt
      if (type === 'prompt') {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
          }
        }, 50);
      }
    }
  }, [isOpen, defaultValue, type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close(type === 'prompt' ? null : false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close, type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'prompt') {
      close(inputVal.trim());
    } else {
      close(true);
    }
  };

  const renderIcon = () => {
    switch (icon) {
      case 'trash':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 size={20} />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
        );
      case 'folder':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FolderPlus size={20} />
          </div>
        );
      case 'lesson':
        return (
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
        );
      case 'template':
        return (
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Bookmark size={20} />
          </div>
        );
      case 'edit':
        return (
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Edit2 size={20} />
          </div>
        );
      case 'help':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle size={20} />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
        );
    }
  };

  const getConfirmButtonVariant = () => {
    if (variant === 'danger') return 'danger';
    return 'primary';
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3">
            {renderIcon()}
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          <button
            onClick={() => close(type === 'prompt' ? null : false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 flex flex-col gap-4">
          {message && (
            <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </div>
          )}

          {type === 'prompt' && (
            <div className="flex flex-col gap-1.5">
              <input
                ref={inputRef}
                type={inputType || 'text'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-2xs"
              />
            </div>
          )}

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {type !== 'alert' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => close(type === 'prompt' ? null : false)}
              >
                {cancelText || 'Cancelar'}
              </Button>
            )}
            <Button
              type="submit"
              variant={getConfirmButtonVariant()}
              size="sm"
            >
              {type === 'confirm' && variant === 'danger' && <Trash2 size={15} />}
              {confirmText || (type === 'prompt' ? 'Guardar' : 'Confirmar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
