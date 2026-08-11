import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { fetchCandidates } from '@/lib/engines/shared/candidate'
import { fetchServedQuestions } from '@/lib/engines/shared/questions'
import { recordCooldown } from '@/lib/engines/shared/cooldown'
import { runQuickfireLottery } from '@/lib/engines/quickfire/lottery'
import { LotteryResult } from '@/lib/engines/shared/types'

export async function POST(req: NextRequest) {
  try {
    // Step 1 — auth
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const countPerSubject: number = body.count_per_subject ?? 5

    if (countPerSubject < 1 || countPerSubject > 50) {
      return NextResponse.json(
        { error: 'count_per_subject must be between 1 and 50' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Step 2 — fetch user's registered JAMB subjects
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('jamb_subjects')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.jamb_subjects || user.jamb_subjects.length === 0) {
      return NextResponse.json(
        { error: 'No subjects registered for this user' },
        { status: 400 }
      )
    }

    // Step 3 — resolve subject slugs to IDs
    // jamb_subjects stores slugs e.g ['physics', 'chemistry']
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('id, slug, name')
      .in('slug', user.jamb_subjects)

    if (subjectError || !subjects || subjects.length === 0) {
      return NextResponse.json(
        { error: 'Could not resolve user subjects' },
        { status: 500 }
      )
    }

    // Step 4 — run lottery per subject
    const lotteryResults: LotteryResult[] = []

    for (const subject of subjects) {
      // Fetch lightweight candidates for this subject
      const candidates = await fetchCandidates(
        userId,
        subject.id
        // No topic_id — Quickfire draws from full subject pool
      )

      // Run weighted lottery
      const result = runQuickfireLottery(
        candidates,
        subject.id,
        countPerSubject
      )

      lotteryResults.push(result)
    }

    // Step 5 — collect all winning IDs
    const allWinningIds = lotteryResults.flatMap(r => r.question_ids)

    if (allWinningIds.length === 0) {
      return NextResponse.json({
        questions: [],
        exhausted: true
      })
    }

    // Step 6 — fetch full question data for winners only
    // correct_option_id never included
    const questions = await fetchServedQuestions(lotteryResults)

    // Step 7 — record cooldown in background
    // Don't await — keeps response fast
    recordCooldown(userId, allWinningIds).catch(err =>
      console.error('[quickfire] cooldown record failed:', err)
    )

    // Step 8 — return
    return NextResponse.json({
      questions,
      meta: {
        total: questions.length,
        by_subject: lotteryResults.map((r, i) => ({
          subject_id: r.subject_id,
          subject_name: subjects[i]?.name ?? '',
          count: r.question_ids.length
        }))
      }
    })

  } catch (err: any) {
    console.error('[quickfire/pick] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
