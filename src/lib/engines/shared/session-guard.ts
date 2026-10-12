import { createClient } from '@/lib/supabase/server'

export async function hasActiveSession(
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exam_sessions')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'active'])
    .limit(1)
    .maybeSingle()

  // No matching row means there is no active session. A database error is
  // different: propagate it so session creation fails closed instead of
  // treating an unavailable guard as permission to create another session.
  if (error) throw error

  return !!data
}
