import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase secret key configuration');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const conceptWindowId = body?.concept_window_id;
    const actionType = body?.action_type;
    const timeSpentSeconds = Number.isFinite(body?.time_spent_seconds) ? Math.max(0, Math.floor(body.time_spent_seconds)) : 0;

    if (!conceptWindowId || !actionType) {
      return NextResponse.json(
        { error: 'concept_window_id and action_type are required.' },
        { status: 400 },
      );
    }

    const db = getDB();
    const { data: batch, error: batchError } = await db
      .from('nba_batches')
      .select('id,status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('batch_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (batchError) throw batchError;
    if (!batch) return NextResponse.json({ error: 'No active NBA batch.' }, { status: 404 });

    const { data: log, error: logError } = await db
      .from('nba_log')
      .select('id,status')
      .eq('user_id', userId)
      .eq('batch_id', batch.id)
      .eq('concept_window_id', conceptWindowId)
      .eq('action_type', actionType)
      .maybeSingle();

    if (logError) throw logError;
    if (!log) return NextResponse.json({ error: 'NBA mission not found in the active batch.' }, { status: 404 });

    if (log.status === 'completed') {
      if (timeSpentSeconds > 0) {
        const { error: timeError } = await db.from('nba_log').update({ time_spent_seconds: timeSpentSeconds }).eq('id', log.id).eq('user_id', userId);
        if (timeError) throw timeError;
      }
    } else {
      const { error: completeError } = await db
        .from('nba_log')
        .update({ status: 'completed', completed_at: new Date().toISOString(), time_spent_seconds: timeSpentSeconds })
        .eq('id', log.id)
        .eq('user_id', userId)
        .eq('batch_id', batch.id);
      if (completeError) throw completeError;
    }

    const { count, error: pendingError } = await db
      .from('nba_log')
      .select('id', { count: 'exact', head: true })
      .eq('batch_id', batch.id)
      .eq('status', 'pending');
    if (pendingError) throw pendingError;

    const batchCompleted = (count ?? 0) === 0;

    if (batchCompleted) {
      const { error: batchCompleteError } = await db
        .from('nba_batches')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', batch.id)
        .eq('status', 'active');
      if (batchCompleteError) throw batchCompleteError;
    }

    return NextResponse.json({ completed: true, batch_completed: batchCompleted }, { status: 200 });
  } catch (error) {
    console.error('[NBA] Failed to complete mission:', error);
    return NextResponse.json({ error: 'Failed to complete NBA mission.' }, { status: 500 });
  }
}
