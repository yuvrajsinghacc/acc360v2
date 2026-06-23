import { NextRequest, NextResponse } from 'next/server'
import { getAllCompanies } from '@/lib/airtable'
import { getCompanyNews } from '@/lib/newsroom'
import { saveNewsletter } from '@/lib/kv'
import { getCompanyName, extractUrl } from '@/lib/utils'
import type { Newsletter, NewsletterCompanySection } from '@/types/newsletter'

// Vercel Hobby plan maximum for serverless functions is 60 seconds.
// 8 sequential web searches (~20s each) would exceed that, so companies run in parallel
// via Promise.allSettled — same per-company resilience as sequential, fits within 60s.
export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Fires at 11:00 UTC = 6am EST (winter) / 7am EDT (summer). Vercel Cron does not
// guarantee sub-minute accuracy; exact timing varies by a few minutes.
// Configured in vercel.json: { "schedule": "0 11 * * *" }

function domainFromWebsite(website?: string): string | undefined {
  if (!website) return undefined
  try {
    const u = website.startsWith('http') ? website : `https://${website}`
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

export async function GET(req: NextRequest) {
  // Vercel Cron passes the secret in the Authorization header.
  // Reject any caller that doesn't have it.
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    const all = await getAllCompanies()
    const hotList = all.filter((c) => Boolean(c.fields['On Hot List']))

    if (hotList.length === 0) {
      return NextResponse.json({ error: 'No Hot List companies found' }, { status: 404 })
    }

    // Run all companies in parallel. Promise.allSettled isolates failures per company.
    const settled = await Promise.allSettled(
      hotList.map(async (company): Promise<NewsletterCompanySection> => {
        const f        = company.fields
        const name     = getCompanyName(f)
        const website  = extractUrl(f['Website'] as string | undefined)
        const domain   = domainFromWebsite(website)
        const vertical = (f['Vertical'] as string | undefined) ?? undefined
        const hq       = ((f['HQ'] ?? f['HQ (verified)']) as string | undefined) ?? undefined
        const contact  = (f['Contact'] as string | undefined) ?? undefined

        const result = await getCompanyNews({ name, domain, vertical, hq, contact })
        return { companyId: company.id, companyName: name, domain, result }
      }),
    )

    const sections: NewsletterCompanySection[] = settled
      .filter((r): r is PromiseFulfilledResult<NewsletterCompanySection> => r.status === 'fulfilled')
      .map((r) => r.value)

    const newsletter: Newsletter = {
      date: today,
      generatedAt: new Date().toISOString(),
      sections,
      companiesAttempted: hotList.length,
      companiesSucceeded: sections.length,
    }

    const saved = await saveNewsletter(newsletter)

    return NextResponse.json({
      ok: true,
      date: today,
      companiesAttempted: newsletter.companiesAttempted,
      companiesSucceeded: newsletter.companiesSucceeded,
      saved,
    })
  } catch (err) {
    console.error('[newsletter/generate]', err)
    return NextResponse.json(
      { error: 'Generation failed', details: err instanceof Error ? err.message : undefined },
      { status: 500 },
    )
  }
}
