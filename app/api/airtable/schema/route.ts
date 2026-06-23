import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getTableSchema } from '@/lib/airtable'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const schema = await getTableSchema()
    return NextResponse.json(schema)
  } catch (err) {
    console.error('[GET /api/airtable/schema]', err)
    return NextResponse.json({ error: 'Failed to fetch schema', details: String(err) }, { status: 500 })
  }
}
