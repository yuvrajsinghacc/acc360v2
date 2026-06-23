import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getArchiveDates } from '@/lib/kv'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dates = await getArchiveDates()
  return NextResponse.json({ dates })
}
