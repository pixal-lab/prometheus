import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  Home,
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Calculator,
  ChevronRight,
  Search,
} from 'lucide-react';
import { useTranslation } from '../core/i18n/useTranslation';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const destinations = [
    {
      to: '/',
      label: t('nav_home'),
      title: t('title_home_nav'),
      icon: Home,
      descKey: 'home',
    },
    {
      to: '/calendar',
      label: t('nav_calendar'),
      title: t('title_calendar_nav'),
      icon: Calendar,
      descKey: 'calendar',
    },
    {
      to: '/timetable',
      label: t('nav_timetable'),
      title: t('title_timetable_nav'),
      icon: Clock,
      descKey: 'timetable',
    },
    {
      to: '/lesson-planner',
      label: t('nav_lesson_planner'),
      title: t('title_planner_nav'),
      icon: BookOpen,
      descKey: 'lesson_planner',
    },
    {
      to: '/gradebook',
      label: t('nav_gradebook'),
      title: t('title_gradebook_nav'),
      icon: GraduationCap,
      descKey: 'gradebook',
    },
    {
      to: '/proof-correction',
      label: t('nav_proof_correction'),
      title: t('title_proof_nav'),
      icon: Calculator,
      descKey: 'proof_correction',
    },
  ];

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-3xl text-center">
        {/* Glow & Compass Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-orange-600/25 rounded-full blur-2xl -z-10 scale-150 animate-pulse" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-orange-50 to-amber-100 dark:from-slate-900 dark:to-orange-950/40 border border-orange-200/90 dark:border-orange-800/40 flex flex-col items-center justify-center shadow-xl shadow-orange-500/10">
            <Compass className="w-12 h-12 text-orange-600 dark:text-orange-400 stroke-[1.8] animate-spin-slow" />
          </div>
        </div>

        {/* 404 Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-orange-600 dark:text-orange-400 bg-orange-100/90 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900/60 uppercase">
            Error {t('not_found_code', '404')}
          </span>
        </div>

        {/* Main Title & Description */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          {t('not_found_title', 'Página no encontrada')}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-5 leading-relaxed">
          {t('not_found_description', 'La página que buscas no existe, fue eliminada o su dirección cambió.')}
        </p>

        {/* Current Path Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-8 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 max-w-full overflow-hidden shadow-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-500 shrink-0">{t('not_found_requested_path', 'Ruta solicitada:')}</span>
          <code className="font-mono text-orange-600 dark:text-orange-400 font-semibold truncate max-w-[200px] sm:max-w-md">
            {location.pathname}
          </code>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/')}
            className="shadow-md shadow-orange-500/20 px-5"
          >
            <Home className="w-4 h-4" />
            <span>{t('not_found_back_home', 'Volver al Inicio')}</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleGoBack}
            className="px-5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('not_found_go_back', 'Página anterior')}</span>
          </Button>
        </div>

        {/* Quick Destinations Cards */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('not_found_popular_destinations', '¿Buscabas alguna de estas secciones?')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {destinations.map(dest => {
              const Icon = dest.icon;
              return (
                <Link
                  key={dest.to}
                  to={dest.to}
                  className="group flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 hover:border-orange-300 dark:hover:border-orange-800 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all duration-200 shadow-xs hover:shadow-md hover:shadow-orange-500/5 hover:-translate-y-0.5"
                >
                  <div className="p-2.5 rounded-lg bg-orange-100/80 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-200">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                      {dest.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {dest.title}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
