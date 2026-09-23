import ReadSession from '@/components/ReadSession';
import type { NBAOutput } from '@/lib/nba/types';

const schedule: NBAOutput[] = [
  {
    subject_id: 'physics',
    topic_id: 'measurement',
    concept_window_id: 'measurement-physical-quantities',
    concept_name: 'Physical Quantities and Units',
    concept_progression_order: 1,
    action_type: 'READ',
    phase: 'HABIT_BUILDING',
    message: 'Start here — read through Physical Quantities and Units first.',
    concept_description:
      'Physical quantities are properties that can be measured and expressed using a numerical value and a unit. Fundamental quantities such as length, mass, and time form the basis of the SI system, while derived quantities are built from them. Understanding units and dimensions helps you check whether physical equations make sense.',
    estimated_minutes: 10,
    time_boundary_reached: false,
    topic_concept_boundary_reached: false,
    continuation_available: true,
    subject_exhausted: false,
    next_transition: null,
  },
  {
    subject_id: 'physics',
    topic_id: 'measurement',
    concept_window_id: 'measurement-dimensions',
    concept_name: 'Dimensions and Dimensional Analysis',
    concept_progression_order: 2,
    action_type: 'READ',
    phase: 'HABIT_BUILDING',
    message: 'Start here — read through Dimensions and Dimensional Analysis first.',
    concept_description:
      'Dimensions describe the physical nature of a quantity in terms of fundamental quantities. Dimensional analysis can be used to test equations, derive relationships, and convert between compatible units.',
    estimated_minutes: 8,
    time_boundary_reached: false,
    topic_concept_boundary_reached: true,
    continuation_available: true,
    subject_exhausted: false,
    next_transition: null,
  },
  {
    subject_id: 'chemistry',
    topic_id: 'atomic-structure',
    concept_window_id: 'atomic-structure-electrons',
    concept_name: 'Electronic Structure',
    concept_progression_order: 1,
    action_type: 'READ',
    phase: 'HABIT_BUILDING',
    message: 'Start here — read through Electronic Structure first.',
    concept_description:
      'The arrangement of electrons in an atom determines many of its chemical properties. Electron shells, subshells, and orbitals provide a framework for understanding atomic structure and periodic trends.',
    estimated_minutes: 9,
    time_boundary_reached: false,
    topic_concept_boundary_reached: false,
    continuation_available: true,
    subject_exhausted: false,
    next_transition: null,
  },
];

export default function ReadSessionPrototypePage() {
  return (
    <ReadSession
      schedule={schedule}
      subjectNames={{
        physics: 'Physics',
        chemistry: 'Chemistry',
      }}
      topicNames={{
        measurement: 'Measurement',
        'atomic-structure': 'Atomic Structure',
      }}
    />
  );
}
