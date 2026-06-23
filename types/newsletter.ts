import type { NewsroomResult } from './newsroom'

/** One Hot List company's section within a newsletter. */
export interface NewsletterCompanySection {
  companyId: string
  companyName: string
  domain?: string
  result: NewsroomResult
}

/** The full daily newsletter object stored in KV. */
export interface Newsletter {
  date: string                        // YYYY-MM-DD (UTC)
  generatedAt: string                 // ISO timestamp
  sections: NewsletterCompanySection[]
  companiesAttempted: number
  companiesSucceeded: number
}

/** Sorted list of YYYY-MM-DD strings (newest first) stored in KV as the archive index. */
export type ArchiveDates = string[]
