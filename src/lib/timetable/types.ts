import type { Phase } from '@/lib/nba/types';

export const DAY_TYPES = ['practice', 'revision', 'rest'] as const;
export type DayType = (typeof DAY_TYPES)[number];

export interface TimetableSubject {
  id: string;
  name: string;
  slug: string;
  weekly_frequency: number;
}

export interface TimetableDay {
  date: string;
  day_type: DayType;
  scheduled_subject_ids: string[];
}

export interface GeneratedTimetable {
  month: string;
  phase: Phase;
  days: TimetableDay[];
}

export interface TimetableGenerationResult {
  timetable_id: string;
  month: string;
  phase: Phase;
  days: TimetableDay[];
}
