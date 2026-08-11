// lib/engines/shared/types.ts

export type EngineMode = 'quickfire' | 'campaign'

export interface SubjectRequest {
  subject_id: string
  topic_id?: string
  count: number
}

export interface EngineRequest {
  mode: EngineMode
  requests: SubjectRequest[]
}

export interface QuestionCandidate {
  id: string
  topic_id: string
  setter_difficulty: number
  times_seen: number
  quickfire_points: number
  under_cooldown: boolean
}

export interface QuestionOption {
  id: string
  option_text: string
  position: number
}

export interface ServedQuestion {
  id: string
  subject_id: string
  topic_id: string
  question_text: string
  setter_difficulty: number
  options: QuestionOption[]
}

export interface LotteryResult {
  subject_id: string
  question_ids: string[]
}
