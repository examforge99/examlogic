import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const body = await req.json()

    const {
      signal_type       = 'subject_avoidance',
      signal_category   = 'subject_balance',
      urgency           = 0.7,
      severity          = 0.6,
      motivation        = 0.5,
      empathy           = 0.5,
      directness        = 0.6,
      positivity        = 0.4,
      neglect_factor    = 1.0,
      fatigue_tier      = 0,
      phase             = 'building',
      subject_name      = null,
      topic_name        = null,
      consecutive_ignores = 0,
      recent_accuracy   = null,
      days_to_exam      = 30,
      score_gap         = null,
    } = body

    const { data, error } = await supabase.rpc('construct_message', {
      p_signal_type:          signal_type,
      p_signal_category:      signal_category,
      p_urgency:              urgency,
      p_severity:             severity,
      p_motivation:           motivation,
      p_empathy:              empathy,
      p_directness:           directness,
      p_positivity:           positivity,
      p_neglect_factor:       neglect_factor,
      p_fatigue_tier:         fatigue_tier,
      p_phase:                phase,
      p_subject_name:         subject_name,
      p_topic_name:           topic_name,
      p_consecutive_ignores:  consecutive_ignores,
      p_recent_accuracy:      recent_accuracy,
      p_days_to_exam:         days_to_exam,
      p_score_gap:            score_gap,
    })

    if (error) {
      console.error('construct_message error:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
