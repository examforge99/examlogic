export interface TopicCandidate {
  id: string
  question_count: number
}

export interface TopicAllocation {
  topic_id: string
  slots: number
  difficulty_split: Record<number, number> // { 1: 0, 2: 1, 3: 4, 4: 3, 5: 1 }
}

export interface DifficultyTemplate {
  id: number
  question_count: number
  difficulty_distribution: {
    level1_percent: number
    level2_percent: number
    level3_percent: number
    level4_percent: number
    level5_percent: number
  }
}

export interface SimulationSubjectPlan {
  subject_id: string
  question_count: number
  template_id: number
  allocations: TopicAllocation[]
}
