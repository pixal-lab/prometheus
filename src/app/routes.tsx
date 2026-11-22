import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';

// Lazy load feature pages to split the 1.35MB monolithic bundle and maximize offline load speed
const CalendarPage = React.lazy(() =>
  import('../features/calendar/CalendarPage').then(m => ({ default: m.CalendarPage }))
);
const TimetablePage = React.lazy(() =>
  import('../features/timetable/TimetablePage').then(m => ({ default: m.TimetablePage }))
);
const LessonPlannerPage = React.lazy(() =>
  import('../features/lesson-planner/LessonPlannerPage').then(m => ({ default: m.LessonPlannerPage }))
);
const GradebookPage = React.lazy(() =>
  import('../features/gradebook/GradebookPage').then(m => ({ default: m.GradebookPage }))
);
const ProofCorrectionPage = React.lazy(() =>
  import('../features/grade-calculator/ProofCorrectionPage').then(m => ({ default: m.ProofCorrectionPage }))
);

const PageFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-400 select-none animate-pulse">
    <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
    <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Cargando aplicación...</span>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageFallback />}>
            <CalendarPage />
          </Suspense>
        ),
      },
      {
        path: 'timetable',
        element: (
          <Suspense fallback={<PageFallback />}>
            <TimetablePage />
          </Suspense>
        ),
      },
      {
        path: 'lesson-planner',
        element: (
          <Suspense fallback={<PageFallback />}>
            <LessonPlannerPage />
          </Suspense>
        ),
      },
      {
        path: 'gradebook',
        element: (
          <Suspense fallback={<PageFallback />}>
            <GradebookPage />
          </Suspense>
        ),
      },
      {
        path: 'proof-correction',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProofCorrectionPage />
          </Suspense>
        ),
      },
    ],
  },
]);
