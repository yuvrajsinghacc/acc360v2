import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAllCompanies } from '@/lib/airtable'
import { askClaude } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const airtableRecords = await getAllCompanies()

    if (!airtableRecords || airtableRecords.length === 0) {
      return NextResponse.json({
        answer: 'No company data is available in the database. Please check your Airtable connection.',
      })
    }

    console.log('[/api/chat] airtableRecords count:', airtableRecords.length)

    const answer = await askClaude(message, airtableRecords)
    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[POST /api/chat]', err)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
