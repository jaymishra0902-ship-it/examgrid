export type Subject = 'Physics' | 'Chemistry' | 'Mathematics' | 'Computer Science';

export type TopicStatus = 'not_started' | 'in_progress' | 'mastered';

export type Priority = 'high' | 'medium' | 'low';

export interface Profile {
  id: string;
  full_name: string;
  target_exam: string;
  avatar_color: string;
}

export interface SyllabusTopic {
  id: string;
  user_id: string;
  subject: string;
  topic_name: string;
  status: TopicStatus;
}

export interface ExamDate {
  id: string;
  user_id: string;
  exam_name: string;
  exam_date: string;
}

export interface DailyTarget {
  id: string;
  user_id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  target_date: string;
}

export interface StudyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  total_study_days: number;
}

export interface FormulaCard {
  id: string;
  subject: Subject;
  title: string;
  content: string;
  category: string;
}

export interface AppUser {
  id: string;
  full_name: string;
  target_exam: string;
  avatar_color: string;
  isGuest: boolean;
}
