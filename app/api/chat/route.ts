import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAllCompanies } from '@/lib/airtable'
import { streamClaude } from '@/lib/claude'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { message } = await req.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const companies = await getAllCompanies()
    if (!companies?.length) {
      return NextResponse.json({ error: 'No company data available' }, { status: 503 })
    }

    const stream = streamClaude(message, companies)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[POST /api/chat]', err)
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 })
  }
}
