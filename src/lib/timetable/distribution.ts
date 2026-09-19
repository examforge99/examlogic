import type { TimetableDay, TimetableSubject } from './types';
import { allocateWeeklySubjects } from './allocation';

function distanceToNearestAssigned(dayIndex: number, assigned: number[]): number {
  if (!assigned.length) return Number.POSITIVE_INFINITY;
  return Math.min(...assigned.map((index) => Math.abs(index - dayIndex)));
}

function distributeWeek(
  days: TimetableDay[],
  subjects: TimetableSubject[],
): TimetableDay[] {
  if (!days.length || !subjects.length) return days;

  const counts = allocateWeeklySubjects(subjects, days.length);
  const assignedBySubject = new Map<string, number[]>(
    subjects.map((subject) => [subject.id, []]),
  );

  const remaining = new Map(counts);

  while ([...remaining.values()].some((count) => count > 0)) {
    const subject = subjects
      .filter((candidate) => (remaining.get(candidate.id) ?? 0) > 0)
      .sort((a, b) => {
        const ra = remaining.get(a.id) ?? 0;
        const rb = remaining.get(b.id) ?? 0;
        return rb - ra || b.weekly_frequency - a.weekly_frequency || a.id.localeCompare(b.id);
      })[0];

    if (!subject) break;

    const candidates = days
      .map((day, index) => ({
        day,
        index,
        load: day.scheduled_subject_ids.length,
        distance: distanceToNearestAssigned(index, assignedBySubject.get(subject.id) ?? []),
      }))
      .filter(({ day }) => !day.scheduled_subject_ids.includes(subject.id))
      .sort((a, b) => {
        if (a.load !== b.load) return a.load - b.load;
        if (a.distance !== b.distance) return b.distance - a.distance;
        return a.index - b.index;
      });

    const chosen = candidates[0];
    if (!chosen) {
      remaining.set(subject.id, 0);
      continue;
    }

    chosen.day.scheduled_subject_ids.push(subject.id);
    assignedBySubject.get(subject.id)!.push(chosen.index);
    remaining.set(subject.id, (remaining.get(subject.id) ?? 0) - 1);
  }

  return days;
}

export function distributeSubjectsAcrossWeeks(
  days: TimetableDay[],
  subjects: TimetableSubject[],
): TimetableDay[] {
  const byWeek = new Map<string, TimetableDay[]>();

  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const monday = new Date(date);
    const weekday = monday.getUTCDay();
    const offset = weekday === 0 ? -6 : 1 - weekday;
    monday.setUTCDate(monday.getUTCDate() + offset);
    const key = monday.toISOString().slice(0, 10);

    const bucket = byWeek.get(key) ?? [];
    bucket.push(day);
    byWeek.set(key, bucket);
  }

  for (const weekDays of byWeek.values()) {
    distributeWeek(weekDays, subjects);
  }

  return days;
}
