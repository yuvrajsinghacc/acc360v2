import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAllCompanies, createCompany } from '@/lib/airtable'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const companies = await getAllCompanies()
    return NextResponse.json(companies)
  } catch (err) {
    console.error('[GET /api/companies]', err)
    return NextResponse.json(
      { error: 'Failed to fetch companies', details: String(err) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const fields = await req.json()
    const company = await createCompany(fields)
    return NextResponse.json(company, { status: 201 })
  } catch (err) {
    console.error('[POST /api/companies]', err)
    return NextResponse.json(
      { error: 'Failed to create company', details: String(err) },
      { status: 500 }
    )
  }
}
