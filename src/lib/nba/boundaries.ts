import type { BoundaryState } from './types';

export function checkBoundaries(
  time_used_mins: number,
  daily_hours: number | null,
  concepts_completed: number,
  total_concepts: number,
): BoundaryState {
  const time_boundary_reached =
    daily_hours !== null && daily_hours > 0
      ? time_used_mins >= daily_hours * 60
      : false;

  const topic_concept_boundary_reached =
    total_concepts > 0 && concepts_completed >= total_concepts;

  return {
    time_boundary_reached,
    topic_concept_boundary_reached,
    continuation_available:
      !time_boundary_reached && !topic_concept_boundary_reached,
    subject_exhausted: false,
  };
}
