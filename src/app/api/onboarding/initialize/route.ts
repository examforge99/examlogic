import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { generateMonthlyTimetable } from '@/lib/timetable/generator';

const DAYS = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
const REQUIRED_SUBJECT_COUNT = 4;
const REQUIRED_ENGLISH_SLUG = 'use-of-english';

type OnboardingBody = {
  exam_date?: unknown;
  study_days?: unknown;
  daily_hours?: unknown;
  subject_ids?: unknown;
};

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as OnboardingBody;

    const examDate = typeof body.exam_date === 'string' ? body.exam_date : '';
    const studyDays = Array.isArray(body.study_days)
      ? body.study_days.filter((day): day is string => typeof day === 'string')
        .map((day) => day.toLowerCase().slice(0, 3))
      : [];
    const dailyHours = typeof body.daily_hours === 'number' ? body.daily_hours : Number(body.daily_hours);
    const subjectIds = Array.isArray(body.subject_ids)
      ? body.subject_ids.filter((id): id is string => typeof id === 'string')
      : [];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(examDate)) {
      return NextResponse.json({ error: 'A valid exam_date is required.' }, { status: 400 });
    }

    const exam = new Date(`${examDate}T00:00:00Z`);
    if (Number.isNaN(exam.getTime())) {
      return NextResponse.json({ error: 'A valid exam_date is required.' }, { status: 400 });
    }

    const uniqueDays = [...new Set(studyDays)];
    if (uniqueDays.length < 5 || uniqueDays.some((day) => !DAYS.has(day))) {
      return NextResponse.json({ error: 'Select at least 5 valid study days.' }, { status: 400 });
    }

    if (!Number.isFinite(dailyHours) || dailyHours <= 0) {
      return NextResponse.json({ error: 'daily_hours must be greater than 0.' }, { status: 400 });
    }

    const uniqueSubjectIds = [...new Set(subjectIds)];

    if (uniqueSubjectIds.length !== REQUIRED_SUBJECT_COUNT) {
      return NextResponse.json({ error: 'Select exactly 4 JAMB subjects.' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !secret) throw new Error('Supabase server credentials are not configured.');

    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(supabaseUrl, secret, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: subjects, error: subjectError } = await db
      .from('subjects')
      .select('id')
      .in('id', uniqueSubjectIds);

    if (subjectError) throw subjectError;

    if ((subjects ?? []).length !== uniqueSubjectIds.length) {
      return NextResponse.json({ error: 'One or more selected subjects are not available.' }, { status: 400 });
    }

    const { data: selectedSubjects, error: selectedSubjectError } = await db
      .from('subjects')
      .select('id,slug')
      .in('id', uniqueSubjectIds);

    if (selectedSubjectError) throw selectedSubjectError;

    if (!(selectedSubjects ?? []).some((subject) => subject.slug === REQUIRED_ENGLISH_SLUG)) {
      return NextResponse.json({ error: 'Use of English is required.' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await db
      .from('monthly_timetable')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json({ error: 'Your timetable has already been created.' }, { status: 409 });
    }

    const { error: updateError } = await db
      .from('users')
      .update({
        exam_date: examDate,
        study_days: uniqueDays,
        daily_hours: dailyHours,
        jamb_subjects: uniqueSubjectIds,
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    const timetable = await generateMonthlyTimetable(userId);

    return NextResponse.json({
      onboarding: {
        exam_date: examDate,
        study_days: uniqueDays,
        daily_hours: dailyHours,
        subject_ids: uniqueSubjectIds,
      },
      timetable,
    }, { status: 201 });
  } catch (error) {
    console.error('[Onboarding] Failed to initialize student:', error);

    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to initialize onboarding.',
    }, { status: 400 });
  }
}
