// ─── Newsroom Types ──────────────────────────────────────────────────────────
// Shared between the API route, the Claude lib, and the UI component.

/** The category buckets a story can fall into. Keep in sync with CATEGORY_META in the UI. */
export type NewsCategory =
  | 'ma'         // M&A / acquisitions / mergers / investment
  | 'leadership' // hires, departures, exec moves, org changes
  | 'finance'    // revenue, funding, financial performance, pricing
  | 'client'     // new client wins, account moves, campaigns
  | 'drama'      // reputation, controversy, layoffs, litigation
  | 'award'      // awards, recognition, rankings
  | 'general'    // relevant but uncategorized

/** Source credibility tier, ported from the original newsroom's tiering idea. */
export type SourceTier = 't1' | 't2' | 't3'

/** Overall confidence in the brief, based on volume + source quality. */
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW'

export interface NewsArticle {
  title: string
  url: string
  source: string          // publisher name, e.g. "AdAge"
  sourceDomain?: string   // e.g. "adage.com" — used for tier lookup + favicon
  tier: SourceTier
  publishedAt?: string    // ISO date when known, else undefined
  ageLabel?: string       // human label like "3d ago" (Claude may provide)
  category: NewsCategory
  snippet: string         // 1–2 sentence summary, paraphrased (no long quotes)
}

export interface NewsFlag {
  category: NewsCategory  // which lens this flag belongs to
  text: string            // one-line, deal-relevant statement
}

export interface NewsroomBrief {
  summary: string         // 2–4 sentence executive summary
  flags: NewsFlag[]       // key signals for the deal team (0–5)
  confidence: Confidence
  sourceCount: number     // distinct sources represented
}

export interface NewsroomResult {
  company: string
  domain?: string
  generatedAt: string     // ISO timestamp
  brief: NewsroomBrief
  articles: NewsArticle[]
  /** Set when the search genuinely found little or nothing — UI shows an honest empty state. */
  sparse?: boolean
  note?: string           // optional human-readable note (e.g. why results are thin)
}

/** Shape returned by the API route on failure. */
export interface NewsroomError {
  error: string
  details?: string
}
