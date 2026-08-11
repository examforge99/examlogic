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
    .single()

  if (error) return false
  return !!data
}
