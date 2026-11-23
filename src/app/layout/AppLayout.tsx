import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from '../../components/ui/Toast';
import { DialogContainer } from '../../components/ui/Dialog';
import { useTranslation } from '../../core/i18n/useTranslation';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { t, language } = useTranslation();

  // Dynamic document title update per route and language
  useEffect(() => {
    const path = location.pathname;
    let pageTitle = '';
    if (path === '/' || path === '') {
      pageTitle = t('calendar');
    } else if (path.startsWith('/timetable')) {
      pageTitle = t('timetable');
    } else if (path.startsWith('/lesson-planner')) {
      pageTitle = t('lesson_planner');
    } else if (path.startsWith('/gradebook')) {
      pageTitle = t('gradebook');
    } else if (path.startsWith('/proof-correction')) {
      pageTitle = t('proof_correction');
    } else {
      pageTitle = t('not_found_title');
    }

    document.title = pageTitle ? `${pageTitle} | Prometheus` : 'Prometheus';
  }, [location.pathname, language, t]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors print:bg-white print:text-slate-950">
      <Header />
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 print:p-0 print:m-0 print:max-w-none">
        <Outlet />
      </main>
      <div className="print:hidden">
        <ToastContainer />
        <DialogContainer />
      </div>
    </div>
  );
};

