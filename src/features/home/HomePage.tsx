import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';
import { useTranslation } from '../../core/i18n/useTranslation';
import { useCalendarStore } from '../calendar/store/useCalendarStore';
import { useTimetableStore } from '../timetable/store/useTimetableStore';
import { useLessonPlannerStore } from '../lesson-planner/store/useLessonPlannerStore';
import { useGradebookStore } from '../gradebook/store/useGradebookStore';
import { reloadAllStores } from '../../core/storage/rehydrate';
import { DayOfWeek, TimetableEvent } from '../../core/types/timetable.types';
import { LessonTreeNode, LessonItem } from '../../core/types/lesson.types';
import { HomeHeader } from './components/HomeHeader';
import { TodayClassesWidget, ClassStatusInfo } from './components/TodayClassesWidget';
import { RecentLessonsWidget, RecentLessonItem } from './components/RecentLessonsWidget';
import { UpcomingAssessmentsWidget } from './components/UpcomingAssessmentsWidget';

// Helper to extract recent lessons for quick resume
function extractRecentLessons(
  nodes: Record<string, LessonTreeNode> | undefined,
  currentPath: string[] = []
): RecentLessonItem[] {
  if (!nodes) return [];
  let list: RecentLessonItem[] = [];
  for (const key of Object.keys(nodes)) {
    const node = nodes[key];
    if ('children' in node && node.children) {
      list = list.concat(extractRecentLessons(node.children, [...currentPath, key]));
    } else if ('content' in node) {
      const item = node as LessonItem;
      list.push({
        id: item.id,
        title: item.title,
        date: item.date || '',
        path: [...currentPath, key],
      });
    }
  }
  return list;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const { classBlocks } = useCalendarStore();
  const { data: timetableData } = useTimetableStore();
  const { data: lessonPlannerData, setActiveLesson } = useLessonPlannerStore();
  const { data: gradebookData, selectCourse, setActiveTab } = useGradebookStore();

  useEffect(() => {
    reloadAllStores();
  }, []);

  // Today's date and time metadata
  const today = useMemo(() => dayjs(), []);
  const todayDateStr = today.format('YYYY-MM-DD');

  // Dynamic Greeting based on time of day (evaluated on render for instant language reactivity)
  const hour = today.hour();
  const greeting =
    hour < 12
      ? t('hub_greeting_morning')
      : hour < 19
      ? t('hub_greeting_afternoon')
      : t('hub_greeting_evening');

  // Formatted date string (evaluated on render with active language locale)
  const localizedToday = today.locale(language);
  const formattedToday =
    language === 'es'
      ? `${localizedToday.format('dddd').charAt(0).toUpperCase() + localizedToday.format('dddd').slice(1)}, ${localizedToday.format('D [de] MMMM, YYYY')}`
      : localizedToday.format('dddd, MMMM D, YYYY');

  // Current day of week in Timetable (monday to friday)
  const dayIndex = today.day(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const dayMapping: Record<number, DayOfWeek> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
  };
  const currentTimetableDay: DayOfWeek | null = dayMapping[dayIndex] || null;

  // Status calculation for each timetable class block (ongoing, upcoming, finished)
  const getBlockTimeStatus = (startTime: string, endTime: string): 'ongoing' | 'upcoming' | 'finished' => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const currentH = today.hour();
    const currentM = today.minute();

    const currentMinutes = currentH * 60 + currentM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return 'ongoing';
    }
    if (currentMinutes < startMinutes) {
      return 'upcoming';
    }
    return 'finished';
  };

  // Scheduled classes for today from Timetable with their dynamic status
  const classesWithStatus: ClassStatusInfo[] = useMemo(() => {
    if (!currentTimetableDay || !timetableData[currentTimetableDay]) return [];
    const events = [...(timetableData[currentTimetableDay]?.events || [])].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    return events.map(block => ({
      block,
      status: getBlockTimeStatus(block.startTime, block.endTime),
    }));
  }, [currentTimetableDay, timetableData, today]);

  // Identify ongoing class title for header badge
  const ongoingClass = useMemo(() => {
    return classesWithStatus.find(c => c.status === 'ongoing');
  }, [classesWithStatus]);

  // Scheduled calendar blocks / assessments for today
  const todayCalendarEvents = useMemo(() => {
    return classBlocks.filter(b => b.date === todayDateStr);
  }, [classBlocks, todayDateStr]);

  // Upcoming evaluations in next 14 days
  const upcomingAssessments = useMemo(() => {
    return classBlocks
      .filter(b => {
        if (!b.date || b.date <= todayDateStr) return false;
        const diffDays = dayjs(b.date).diff(today, 'day');
        return diffDays >= 0 && diffDays <= 14;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [classBlocks, todayDateStr, today]);

  // Recent lesson plans for quick resume
  const recentLessons = useMemo(() => {
    return extractRecentLessons(lessonPlannerData).slice(0, 3);
  }, [lessonPlannerData]);

  // Quick Action handlers
  const handleTakeAttendance = (block?: TimetableEvent) => {
    if (block && gradebookData.courses) {
      const blockTitleLower = block.title.trim().toLowerCase();
      const matched = gradebookData.courses.find(c =>
        blockTitleLower.includes(c.name.trim().toLowerCase()) ||
        c.name.trim().toLowerCase().includes(blockTitleLower)
      );
      if (matched) {
        selectCourse(matched.id);
      }
    }
    setActiveTab('attendance');
    navigate('/gradebook');
  };

  const handleOpenLesson = (lesson: RecentLessonItem) => {
    setActiveLesson(lesson.id, lesson.path);
    navigate('/lesson-planner');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header con saludo y contexto de la jornada */}
      <HomeHeader
        greeting={greeting}
        formattedToday={formattedToday}
        classesCount={classesWithStatus.length}
        ongoingClassTitle={ongoingClass?.block.title}
      />

      {/* 2. Grid de tres columnas: Tablero operativo principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {/* Columna 1: Mi Jornada de Hoy */}
        <div className="md:col-span-2 lg:col-span-1">
          <TodayClassesWidget
            classes={classesWithStatus}
            currentDayLabel={currentTimetableDay || undefined}
            onTakeAttendance={handleTakeAttendance}
          />
        </div>

        {/* Columna 2: Retomar Lección Reciente */}
        <div>
          <RecentLessonsWidget
            recentLessons={recentLessons}
            onOpenLesson={handleOpenLesson}
          />
        </div>

        {/* Columna 3: Evaluaciones y Eventos */}
        <div>
          <UpcomingAssessmentsWidget
            todayEvents={todayCalendarEvents}
            upcomingAssessments={upcomingAssessments}
          />
        </div>
      </div>
    </div>
  );
};
