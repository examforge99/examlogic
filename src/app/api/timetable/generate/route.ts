import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { generateMonthlyTimetable } from '@/lib/timetable/generator';

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await generateMonthlyTimetable(userId, body?.month);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Timetable] Failed to generate timetable:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate timetable.',
      },
      { status: 400 },
    );
  }
}
