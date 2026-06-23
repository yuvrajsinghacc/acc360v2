import { Company } from '@/types'

const SUMMARY_FIELDS = [
  'Company', 'Phase', 'Vertical', 'HQ', 'Satellite Offices',
  'Revenue (MM)', 'Contact', 'Title', 'Website', 'Notes',
]

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'was', 'one', 'our', 'out', 'get', 'has', 'how', 'its', 'may', 'new',
  'now', 'see', 'who', 'did', 'does', 'from', 'give', 'here', 'just',
  'like', 'more', 'some', 'than', 'that', 'them', 'then', 'time', 'very',
  'what', 'when', 'will', 'with', 'your', 'have', 'this', 'about', 'which',
  'their', 'there', 'would', 'could', 'should', 'tell', 'show', 'find',
  'list', 'want', 'need', 'make', 'company', 'companies',
])

const BROAD_PATTERNS = [
  'all companies', 'every company', 'list all', 'show all',
  'tell me about all', 'how many companies', 'total companies',
  'overview', 'give me all', 'all of them', 'full list',
  'summarize all', 'summary of all',
]

export function isBroadQuery(message: string): boolean {
  const lower = message.toLowerCase()
  return BROAD_PATTERNS.some((p) => lower.includes(p))
}

function formatCompany(company: Company, index: number): string {
  const lines = SUMMARY_FIELDS
    .map((key) => {
      const v = company.fields[key]
      if (v === null || v === undefined || v === '') return null
      return `  ${key}: ${Array.isArray(v) ? v.join(', ') : String(v)}`
    })
    .filter(Boolean)
    .join('\n')
  return `[${index + 1}]\n${lines}`
}

function scoreCompany(company: Company, keywords: string[]): number {
  if (keywords.length === 0) return 0
  const text = Object.values(company.fields)
    .filter(Boolean)
    .flatMap((v) => (Array.isArray(v) ? v : [String(v)]))
    .join(' ')
    .toLowerCase()
  return keywords.reduce((score, kw) => score + (text.includes(kw) ? 1 : 0), 0)
}

function buildSummaryContext(companies: Company[]): string {
  const byPhase: Record<string, number> = {}
  const byVertical: Record<string, number> = {}
  companies.forEach((c) => {
    const phase = String(c.fields['Phase'] || 'Unknown')
    const vertical = String(c.fields['Vertical'] || 'Unknown')
    byPhase[phase] = (byPhase[phase] ?? 0) + 1
    byVertical[vertical] = (byVertical[vertical] ?? 0) + 1
  })

  const phaseSummary = Object.entries(byPhase)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  const verticalSummary = Object.entries(byVertical)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  // Representative sample: one per phase, up to 15 total
  const seenPhases = new Set<string>()
  const sample: Company[] = []
  for (const c of companies) {
    const phase = String(c.fields['Phase'] || '')
    if (!seenPhases.has(phase) && sample.length < 15) {
      seenPhases.add(phase)
      sample.push(c)
    }
  }
  for (const c of companies) {
    if (sample.length >= 15) break
    if (!sample.includes(c)) sample.push(c)
  }

  return `DATABASE SUMMARY (${companies.length} companies total)

By Phase:
${phaseSummary}

By Vertical (top 12):
${verticalSummary}

Representative sample (${sample.length} companies shown):

${sample.map((c, i) => formatCompany(c, i)).join('\n\n')}`
}

export function buildChatContext(message: string, companies: Company[]): string {
  if (companies.length === 0) return 'The database is currently empty.'

  if (isBroadQuery(message)) {
    return buildSummaryContext(companies)
  }

  const keywords = message
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

  const scored = companies
    .map((c) => ({ c, score: scoreCompany(c, keywords) }))
    .sort((a, b) => b.score - a.score)

  const top20 = scored.slice(0, 20).map((s) => s.c)
  const note =
    top20.length < companies.length
      ? `Showing ${top20.length} most relevant of ${companies.length} total`
      : `${companies.length} companies`

  return `DATABASE (${note}):\n\n${top20.map((c, i) => formatCompany(c, i)).join('\n\n')}`
}
