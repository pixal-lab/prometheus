import React, { useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import { useTranslation } from '../core/i18n/useTranslation';
import { useTheme } from '../core/theme/useTheme';
import { Button } from '../components/ui/Button';
import { NotFoundPage } from './NotFoundPage';

export const RootErrorBoundary: React.FC = () => {
  const error = useRouteError();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  // If this is a 404 route error response, render the NotFoundPage directly
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <span>Prometheus</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </header>
        <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <NotFoundPage />
        </main>
      </div>
    );
  }

  // Extract error information safely
  let errorMessage = 'Unknown error';
  let errorStack: string | undefined;
  let statusBadge = '';

  if (isRouteErrorResponse(error)) {
    statusBadge = `Error ${error.status} ${error.statusText || ''}`.trim();
    errorMessage = error.data?.message || error.statusText || 'Route Error';
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = JSON.stringify(error, null, 2);
  }

  const handleCopy = async () => {
    const report = [
      `Prometheus Application Error Report`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `Status: ${statusBadge || 'Unhandled Exception'}`,
      `Message: ${errorMessage}`,
      errorStack ? `\nStack:\n${errorStack}` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = report;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 dark:text-white">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <span>Prometheus</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </header>

      {/* Main Error Body */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        {/* Warning Icon Badge */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl -z-10 scale-150" />
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-red-50 to-orange-100 dark:from-red-950/40 dark:to-orange-950/30 border border-red-200 dark:border-red-800/50 flex items-center justify-center shadow-lg shadow-red-500/10">
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {statusBadge && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/50">
              {statusBadge}
            </span>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          {t('error_boundary_title', 'Ha ocurrido un error inesperado')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mb-8 leading-relaxed">
          {t('error_boundary_description', 'Algo salió mal al procesar esta solicitud. Tus datos guardados están seguros.')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 w-full">
          <Button
            variant="primary"
            size="md"
            onClick={handleReload}
            className="shadow-md shadow-orange-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('error_boundary_reload', 'Recargar aplicación')}</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            <Home className="w-4 h-4" />
            <span>{t('error_boundary_go_home', 'Ir al Inicio')}</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleCopy}
            className="text-slate-600 dark:text-slate-300"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">{t('error_boundary_copied', '¡Copiado!')}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t('error_boundary_copy_error', 'Copiar reporte')}</span>
              </>
            )}
          </Button>
        </div>

        {/* Technical Details Accordion */}
        <details className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs group">
          <summary className="px-4 py-3 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <span>{t('error_boundary_details', 'Ver detalles técnicos')}</span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-slate-400" />
          </summary>
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="font-mono text-xs text-red-600 dark:text-red-400 font-semibold mb-2 break-all">
              {errorMessage}
            </div>
            {errorStack && (
              <pre className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-h-48 whitespace-pre-wrap text-left">
                {errorStack}
              </pre>
            )}
          </div>
        </details>
      </main>
    </div>
  );
};
