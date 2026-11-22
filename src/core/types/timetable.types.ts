export type TimetableBlockType = 'course' | 'break' | 'lunch' | 'planning' | 'special';

export interface TimetableEvent {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  color: string;
  type: TimetableBlockType;
  notes?: string;
}

export interface TimetableDay {
  startMinutes: number; // e.g. 480 = 08:00
  endMinutes: number;   // e.g. 1020 = 17:00
  events: TimetableEvent[];
}

export interface TimetableData {
  monday: TimetableDay;
  tuesday: TimetableDay;
  wednesday: TimetableDay;
  thursday: TimetableDay;
  friday: TimetableDay;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface NonCourseBlockConfig {
  type: TimetableBlockType;
  label: string;
  defaultColor: string;
}

