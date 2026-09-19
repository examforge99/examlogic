import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Phase } from '@/lib/nba/types';
import { distributeSubjectsAcrossWeeks } from './distribution';
import type { GeneratedTimetable, TimetableDay, TimetableGenerationResult, TimetableSubject } from './types';
import { getWeeklyFrequency } from './allocation';

const DAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase server credentials are not configured.');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function monthStart(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function normalizeMonth(input?: string): Date {
  const now = new Date();
  if (!input) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  if (!/^\d{4}-\d{2}$/.test(input)) {
    throw new Error('month must use YYYY-MM format.');
  }

  const [year, month] = input.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function parseStudyDays(value: string[] | null | undefined): number[] {
  const days = [...new Set((value ?? []).map((day) => day.toLowerCase().slice(0, 3)))]
    .map((day) => DAY_INDEX[day])
    .filter((day): day is number => day !== undefined);

  return days.sort((a, b) => a - b);
}

function normalizeSubjectName(value: string): string {
  return value.toLowerCase().trim().replace(/_/g, '-').replace(/\s+/g, '-');
}

function resolveSelectedSubjects(
  jambSubjects: string[] | null | undefined,
  rows: Array<{ id: string; name: string; slug: string }>,
): TimetableSubject[] {
  const requested = new Set((jambSubjects ?? []).map(normalizeSubjectName));

  return rows
    .filter((row) => requested.has(normalizeSubjectName(row.slug)) || requested.has(normalizeSubjectName(row.name)))
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      weekly_frequency: getWeeklyFrequency(row.slug),
    }));
}

function createDays(month: Date, studyDays: number[], activeStart: Date, examDate: Date): TimetableDay[] {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const allowed = new Set(studyDays);

  const days: TimetableDay[] = [];
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(Date.UTC(year, monthIndex, day));
    const weekday = date.getUTCDay();

    const isAfterExam = date > examDate;

    days.push({
      date: date.toISOString().slice(0, 10),
      day_type: !isAfterExam && allowed.has(weekday) ? 'practice' : 'rest',
      scheduled_subject_ids: [],
    });
  }

  return days;
}

function calendarStart(examDate: string): Date {
  const parsed = new Date(`${examDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid exam date.');
  return addMonths(parsed, -4);
}

function phaseForMonth(month: Date, examDate: string): Phase {
  const monthDate = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 15));
  const exam = new Date(`${examDate}T00:00:00Z`);
  const days = Math.floor((exam.getTime() - monthDate.getTime()) / 86_400_000);

  if (days > 90) return 'HABIT_BUILDING';
  if (days >= 60) return 'TRANSITION';
  if (days >= 30) return 'PREPARATION';
  return 'PERFORMANCE';
}

async function getUserSubjectIds(db: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await db
    .from('users')
    .select('jamb_subjects')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  const names = Array.isArray(data?.jamb_subjects) ? data.jamb_subjects : [];
  if (!names.length) return [];

  const { data: subjects, error: subjectError } = await db
    .from('subjects')
    .select('id,name,slug');

  if (subjectError) throw subjectError;

  const normalized = new Set(
    names
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim().toLowerCase()),
  );

  return (subjects ?? [])
    .filter((subject) => normalized.has(String(subject.id).toLowerCase())
      || normalized.has(String(subject.name).trim().toLowerCase())
      || normalized.has(String(subject.slug).trim().toLowerCase()))
    .map((subject) => subject.id as string);
}

export async function generateMonthlyTimetable(
  userId: string,
  requestedMonth?: string,
): Promise<TimetableGenerationResult> {
  const supabase = db();
  const month = normalizeMonth(requestedMonth);

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('exam_date, study_days, daily_hours, jamb_subjects')
    .eq('id', userId)
    .maybeSingle();

  if (userError) throw userError;
  if (!user?.exam_date) throw new Error('Exam date is required before generating a timetable.');

  const start = calendarStart(user.exam_date);
  const exam = new Date(`${user.exam_date}T00:00:00Z`);
  const requestedKey = monthStart(month);

  // A timetable is a planning artifact, so don't create one when there
  // are seven days or fewer left before the exam.
  const today = new Date();
  const todayStart = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  ));
  const daysToExam = Math.floor((exam.getTime() - todayStart.getTime()) / 86_400_000);

  if (daysToExam <= 7) {
    throw new Error('Timetable generation is unavailable when seven or fewer days remain before the exam.');
  }

  const studyDays = parseStudyDays(user.study_days);
  const subjectIds = await getUserSubjectIds(db, userId);

  if (!subjectIds.length) {
    throw new Error('Complete onboarding by selecting your JAMB subjects before generating a timetable.');
  }
  if (!studyDays.length) throw new Error('Select at least one study day before generating a timetable.');

  const { data: subjectRows, error: subjectError } = await supabase
    .from('subjects')
    .select('id,name,slug')
    .order('name', { ascending: true });

  if (subjectError) throw subjectError;

  const subjects = resolveSelectedSubjects(user.jamb_subjects, subjectRows ?? []);
  if (!subjects.length) throw new Error('No valid JAMB subjects are configured for this user.');

  const phase = phaseForMonth(month, user.exam_date);
  const generated: GeneratedTimetable = {
    month: requestedKey,
    phase,
    days: createDays(month, studyDays, start, exam),
  };

  distributeSubjectsAcrossWeeks(generated.days.filter((day) => day.day_type === 'practice'), subjects);

  const { data: existing, error: existingError } = await supabase
    .from('monthly_timetable')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    throw new Error('A timetable already exists for this student. A new timetable cannot be generated.');
  }

  const { data: created, error: createError } = await supabase
    .from('monthly_timetable')
    .insert({ user_id: userId, month: requestedKey, phase })
    .select('id')
    .single();

  if (createError) throw createError;
  const timetableId = created.id;

  const { error: insertDaysError } = await supabase
    .from('timetable_days')
    .insert(
      generated.days.map((day) => ({
        timetable_id: timetableId,
        date: day.date,
        day_type: day.day_type,
        scheduled_subject_ids: day.scheduled_subject_ids,
      })),
    );

  if (insertDaysError) throw insertDaysError;

  return {
    timetable_id: timetableId,
    month: requestedKey,
    phase,
    days: generated.days,
  };
}

export function currentCalendarMonth(): string {
  return monthStart(new Date());
}
