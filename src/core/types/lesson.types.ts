export interface LessonPlanContent {
  objectives: string;
  readings: string;
  warmUp: string;
  presentation: string;
  guidedPractice: string;
  independentPractice: string;
  closure: string;
  accommodations: string;
}

export interface LessonItem {
  id: string;
  title: string;
  date: string;
  content: LessonPlanContent;
  templateId?: string;
}

export interface LessonFolder {
  id: string;
  name: string;
  type: 'course' | 'subject' | 'unit' | 'custom';
  children: Record<string, LessonFolder | LessonItem>;
}

export type LessonTreeNode = LessonFolder | LessonItem;
export type LessonPlannerData = Record<string, LessonTreeNode>;

export interface LessonTemplate {
  id: string;
  name: string;
  description?: string;
  content: Partial<LessonPlanContent>;
}

