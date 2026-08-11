import { createClient } from '@/lib/supabase/server'

const COOLDOWN_HOURS = 6

export async function recordCooldown(
  userId: string,
  questionIds: string[]
): Promise<void> {
  const supabase = createClient()

  const nextEligibleAt = new Date(
    Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000
  ).toISOString()

  const records = questionIds.map(id => ({
    user_id: userId,
    question_id: id,
    next_eligible_at: nextEligibleAt,
    last_seen_at: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('user_question_seen')
    .upsert(records, {
      onConflict: 'user_id,question_id',
      ignoreDuplicates: false
    })

  if (error) throw error
}
