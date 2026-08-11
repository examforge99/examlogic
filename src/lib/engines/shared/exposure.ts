import { createClient } from '@/lib/supabase/server'
import { EngineMode } from './types'

// Called after session completes
// Quickfire → increments quickfire_points
// Campaign  → increments times_seen
export async function recordExposure(
  userId: string,
  questionIds: string[],
  mode: EngineMode
): Promise<void> {
  const supabase = createClient()

  for (const questionId of questionIds) {
    if (mode === 'quickfire') {
      await supabase.rpc('increment_quickfire_points', {
        p_user_id: userId,
        p_question_id: questionId,
        p_points: 0.1
      })
    } else if (mode === 'campaign') {
      await supabase.rpc('increment_times_seen', {
        p_user_id: userId,
        p_question_id: questionId
      })
    }
  }
}
