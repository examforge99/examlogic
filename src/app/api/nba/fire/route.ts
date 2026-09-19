import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { fireNBA } from '@/lib/nba/engine';

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const output = await fireNBA(userId);
    return NextResponse.json(output, { status: 200 });
  } catch (error) {
    console.error('[NBA] Failed to fire NBA:', error);
    return NextResponse.json(
      { error: 'Failed to generate NBA recommendation.' },
      { status: 500 },
    );
  }
}
