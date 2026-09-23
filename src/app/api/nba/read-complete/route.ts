import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import type { ActionType } from '@/lib/nba/types';

const ACTION_TYPES: ActionType[] = [
  'READ',
  'RECALL',
  'PRACTICE',
  'REVIEW',
  'DRILL',
  'RELEARN',
];

function todayStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function tomorrowStart() {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  return tomorrow.toISOString();
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const conceptWindowId = body?.concept_window_id;
    const actionType = body?.action_type as ActionType;

    if (
      typeof conceptWindowId !== 'string' ||
      !ACTION_TYPES.includes(actionType)
    ) {
      return NextResponse.json(
        { error: 'Invalid concept completion payload.' },
        { status: 400 },
      );
    }

    const db = createClient();

    const { data: log, error } = await db
      .from('nba_log')
      .select('id')
      .eq('user_id', userId)
      .eq('concept_window_id', conceptWindowId)
      .eq('action_type', actionType)
      .gte('fired_at', todayStart())
      .lt('fired_at', tomorrowStart())
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!log) {
      return NextResponse.json(
        { error: 'This concept is not part of your current NBA schedule.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NBA] Failed to complete read:', error);
    return NextResponse.json(
      { error: 'Failed to save reading progress.' },
      { status: 500 },
    );
  }
}
