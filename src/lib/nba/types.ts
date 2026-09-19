export const PHASES = ['HABIT_BUILDING','TRANSITION','PREPARATION','PERFORMANCE'] as const;
export type Phase = (typeof PHASES)[number];

export const ACTION_TYPES = ['READ','RECALL','PRACTICE','REVIEW','DRILL','RELEARN'] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export interface BoundaryState {
  time_boundary_reached: boolean;
  topic_concept_boundary_reached: boolean;
  continuation_available: boolean;
  subject_exhausted: boolean;
}

export interface NBAOutput {
  subject_id: string;
  topic_id: string;
  concept_window_id: string;
  concept_progression_order: number;
  action_type: ActionType;
  phase: Phase;
  message: string;
  time_boundary_reached: boolean;
  topic_concept_boundary_reached: boolean;
  continuation_available: boolean;
  subject_exhausted: boolean;
  next_transition: null;
}
