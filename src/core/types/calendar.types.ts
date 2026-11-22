export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  ends: 'never' | 'onDate' | 'afterOccurrences';
  endDate?: string;
  occurrences?: number;
  days?: number[]; // 1: Lunes .. 5: Viernes
}

export interface ClassBlock {
  id: string;
  subject: string;
  topic: string;
  date: string; // ISO YYYY-MM-DD
  color?: string;
  evaluation?: boolean;
  evaluationDetails?: string;
  lessonPlanId?: string | null;
  lessonPlan?: any;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
}

export interface SubjectConfig {
  color: string;
  visible: boolean;
  availableDays?: string[]; // ['L', 'M', 'X', 'J', 'V']
}

export interface SchoolYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export type DayType = 'school_event' | 'holiday' | 'in_service' | 'early_release' | 'custom';

export interface CustomDayColor {
  color: string;
  label: string;
}

export interface DayTypeInfo {
  date: string; // YYYY-MM-DD
  type: DayType;
  note?: string;
  color?: string;
}

export interface CalendarExportData {
  classBlocks: ClassBlock[];
  subjects: Record<string, SubjectConfig>;
  subjectOrder?: string[];
  schoolYears?: SchoolYear[];
  activeSchoolYearId?: number | null;
  calendarDayTypes?: Record<string, DayTypeInfo>;
  dayColorPalette?: CustomDayColor[];
}

