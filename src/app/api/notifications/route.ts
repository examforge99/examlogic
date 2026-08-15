import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: query Supabase notifications table when set up
  return NextResponse.json({ hasNotification: false })
}
