import type { TimetableSubject } from './types';

const DEFAULT_WEEKLY_FREQUENCY: Record<string, number> = {
  physics: 4,
  mathematics: 3,
  chemistry: 3,
  biology: 3,
  'use-of-english': 2,
};

export function getWeeklyFrequency(slug: string): number {
  return DEFAULT_WEEKLY_FREQUENCY[slug] ?? 2;
}

function normalizeCounts(
  subjects: TimetableSubject[],
  slots: number,
  availableDays: number,
): Map<string, number> {
  const counts = new Map(subjects.map((subject) => [subject.id, 0]));

  if (!subjects.length || slots <= 0) return counts;

  const totalWeight = subjects.reduce((sum, subject) => sum + subject.weekly_frequency, 0);
  const target = Math.min(slots, subjects.length * availableDays);

  if (target >= subjects.length) {
    for (const subject of subjects) counts.set(subject.id, 1);
  }

  let remaining = target - subjects.length;
  if (remaining < 0) {
    const ordered = [...subjects].sort(
      (a, b) => b.weekly_frequency - a.weekly_frequency || a.id.localeCompare(b.id),
    );
    for (const subject of ordered.slice(0, target)) counts.set(subject.id, 1);
    return counts;
  }

  while (remaining > 0) {
    const candidates = subjects.filter(
      (subject) => (counts.get(subject.id) ?? 0) < availableDays,
    );
    if (!candidates.length) break;

    const next = candidates
      .map((subject) => {
        const count = counts.get(subject.id) ?? 0;
        const ideal = (subject.weekly_frequency / totalWeight) * target;
        return { subject, deficit: ideal - count };
      })
      .sort((a, b) => b.deficit - a.deficit || b.subject.weekly_frequency - a.subject.weekly_frequency || a.subject.id.localeCompare(b.subject.id))[0]
      .subject;

    counts.set(next.id, (counts.get(next.id) ?? 0) + 1);
    remaining -= 1;
  }

  return counts;
}

export function allocateWeeklySubjects(
  subjects: TimetableSubject[],
  studyDayCount: number,
): Map<string, number> {
  if (studyDayCount <= 0 || subjects.length === 0) {
    return new Map(subjects.map((subject) => [subject.id, 0]));
  }

  const requestedSlots = subjects.reduce((sum, subject) => sum + subject.weekly_frequency, 0);
  const minimumSlots = studyDayCount * 2;
  const maximumSlots = studyDayCount * 3;
  const slots = Math.min(maximumSlots, Math.max(minimumSlots, requestedSlots));

  return normalizeCounts(subjects, slots, studyDayCount);
}
