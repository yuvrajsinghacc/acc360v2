import { kv } from '@vercel/kv'
import type { Newsletter, ArchiveDates } from '@/types/newsletter'

const newsKey   = (date: string) => `newsletter:${date}`
const DATES_KEY = 'newsletter:dates'

export async function getNewsletter(date: string): Promise<Newsletter | null> {
  try {
    return await kv.get<Newsletter>(newsKey(date))
  } catch {
    return null
  }
}

export async function saveNewsletter(newsletter: Newsletter): Promise<boolean> {
  try {
    await kv.set(newsKey(newsletter.date), newsletter)
    const existing = (await kv.get<ArchiveDates>(DATES_KEY)) ?? []
    if (!existing.includes(newsletter.date)) {
      const updated = [...existing, newsletter.date].sort().reverse()
      await kv.set(DATES_KEY, updated)
    }
    return true
  } catch (err) {
    console.error('[kv] saveNewsletter failed:', err)
    return false
  }
}

export async function getArchiveDates(): Promise<ArchiveDates> {
  try {
    return (await kv.get<ArchiveDates>(DATES_KEY)) ?? []
  } catch {
    return []
  }
}

export async function getMostRecentNewsletter(): Promise<{ newsletter: Newsletter; date: string } | null> {
  try {
    const dates = await getArchiveDates()
    if (dates.length === 0) return null
    const newsletter = await getNewsletter(dates[0])
    if (!newsletter) return null
    return { newsletter, date: dates[0] }
  } catch {
    return null
  }
}
