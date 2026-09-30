import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { fireNBA } from '@/lib/nba/engine'

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  try {
    const result = await fireNBA(userId)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[NBA] Failed to fire mission service', error)
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 500 })
  }
}
