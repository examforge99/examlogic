import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const SUBJECT_COUNT = 4;
const MIN_STUDY_DAYS = 5;

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secret) {
    console.error('[Onboarding] Supabase server credentials are not configured.');
    return NextResponse.json({ error: 'Onboarding is temporarily unavailable.' }, { status: 503 });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(supabaseUrl, secret, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const [{ data: subjects, error: subjectError }, { data: user, error: userError }, { data: timetable, error: timetableError }] =
      await Promise.all([
        db.from('subjects').select('id,name,slug').order('name', { ascending: true }),
        db.from('users').select('exam_date,study_days,daily_hours,jamb_subjects').eq('id', userId).maybeSingle(),
        db.from('monthly_timetable').select('id').eq('user_id', userId).limit(1).maybeSingle(),
      ]);

    if (subjectError) throw subjectError;
    if (userError) throw userError;
    if (timetableError) throw timetableError;

    return NextResponse.json({
      subjects: subjects ?? [],
      constraints: {
        required_subject_count: SUBJECT_COUNT,
        required_subject_slug: 'use-of-english',
        minimum_study_days: MIN_STUDY_DAYS,
        maximum_study_days: 7,
      },
      current: user
        ? {
            exam_date: user.exam_date,
            study_days: user.study_days,
            daily_hours: user.daily_hours,
            subject_ids: user.jamb_subjects,
            timetable_created: Boolean(timetable),
          }
        : null,
    });
  } catch (error) {
    console.error('[Onboarding] Failed to load onboarding options:', error);
    return NextResponse.json({ error: 'Unable to load onboarding options.' }, { status: 500 });
  }
}
