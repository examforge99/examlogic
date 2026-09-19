import type { Phase } from './types';

export function getPhase(exam_date: string): Phase {
  const examDate = new Date(`${exam_date}T00:00:00Z`);
  const today = new Date();

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const examUtc = Date.UTC(examDate.getUTCFullYear(), examDate.getUTCMonth(), examDate.getUTCDate());
  const daysToExam = Math.floor((examUtc - todayUtc) / 86_400_000);

  if (daysToExam > 90) return 'HABIT_BUILDING';
  if (daysToExam >= 60) return 'TRANSITION';
  if (daysToExam >= 30) return 'PREPARATION';
  return 'PERFORMANCE';
}
