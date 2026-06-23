'use client'

import { useState, useCallback } from 'react'
import {
  Newspaper, Search, RefreshCw, ArrowUpRight, Info,
  TrendingUp, Users, DollarSign, Briefcase, Flame, Award, Circle,
} from 'lucide-react'
import {
  NewsroomResult, NewsArticle, NewsCategory, SourceTier,
} from '@/types/newsroom'

// ─── Category presentation ───────────────────────────────────────────────────
// Single source of truth for label + color + icon per category.
// Colors are chosen to sit on the ACC360 charcoal without clashing with accent-orange.

const CATEGORY_META: Record<NewsCategory, { label: string; filterLabel: string; color: string; Icon: typeof Circle }> = {
  ma:         { label: 'M&A',        filterLabel: 'M&A',         color: '#FFA300', Icon: TrendingUp },
  leadership: { label: 'Leadership', filterLabel: 'Leadership',  color: '#7FA6C9', Icon: Users },
  finance:    { label: 'Finance',    filterLabel: 'Finance',     color: '#8FC7A0', Icon: DollarSign },
  client:     { label: 'Client Wins',filterLabel: 'Client Wins', color: '#FECD42', Icon: Briefcase },
  drama:      { label: 'Reputation', filterLabel: 'Drama',       color: '#D98080', Icon: Flame },
  award:      { label: 'Awards',     filterLabel: 'Awards',      color: '#C9A6D9', Icon: Award },
  general:    { label: 'Relevant',   filterLabel: 'General',     color: '#A7BDB1', Icon: Circle },
}

const TIER_LABEL: Record<SourceTier, string> = { t1: 'Tier 1', t2: 'Tier 2', t3: 'Source' }

interface NewsroomProps {
  /** Airtable record id — when provided, the component fetches via GET /api/newsroom?id= */
  companyId?: string
  /** Direct fields — used by the demo page (POST). Ignored when companyId is set. */
  seed?: { name: string; domain?: string; vertical?: string; hq?: string; contact?: string }
}

export function Newsroom({ companyId, seed }: NewsroomProps) {
  const [data, setData] = useState<NewsroomResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCat, setActiveCat] = useState<NewsCategory | 'all'>('all')

  const pull = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = companyId
        ? await fetch(`/api/newsroom?id=${encodeURIComponent(companyId)}`)
        : await fetch('/api/newsroom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(seed ?? {}),
          })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || 'Failed to pull news')
      }
      const json: NewsroomResult = await res.json()
      setData(json)
      setActiveCat('all')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [companyId, seed])

  // Build category filter counts from the loaded articles.
  const catCounts = (() => {
    const c: Partial<Record<NewsCategory, number>> = {}
    data?.articles.forEach((a) => { c[a.category] = (c[a.category] ?? 0) + 1 })
    return c
  })()

  const visible = data
    ? activeCat === 'all'
      ? data.articles
      : data.articles.filter((a) => a.category === activeCat)
    : []

  // ── Launcher (pre-pull state) ──
  if (!data && !loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-accent-orange/10 border border-accent-orange/20 grid place-items-center">
            <Newspaper size={18} className="text-accent-orange" />
          </div>
          <div>
            <h2 className="font-serif text-lg text-light flex items-center gap-2">Newsroom</h2>
            <p className="text-sm text-muted">Pull the latest verified coverage for this company, summarized and sorted.</p>
          </div>
        </div>
        <button
          onClick={pull}
          className="inline-flex items-center justify-center gap-2 font-medium rounded-2xl bg-accent-orange hover:bg-accent-yellow text-navy px-4 py-2 text-sm shadow-md shadow-accent-orange/20 hover:shadow-xl hover:shadow-accent-orange/40 transition-all duration-[1200ms] active:scale-[0.97] focus:outline-none focus:ring-1 focus:ring-accent-orange whitespace-nowrap"
        >
          <Search size={15} /> Pull latest news
        </button>
        {error && <p className="text-red-400 text-xs sm:hidden">{error}</p>}
      </div>
    )
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center">
        <RefreshCw size={22} className="text-accent-orange animate-spin" />
        <p className="text-sm text-light font-medium">Searching the web for recent coverage…</p>
        <p className="text-xs text-muted">Verifying each result against the company&apos;s identity.</p>
      </div>
    )
  }

  // ── Results ──
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Executive brief */}
      <div className="relative overflow-hidden bg-card border border-border rounded-2xl p-6">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-accent-orange to-accent-teal" />
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-accent-orange">
            Executive Brief
          </span>
          <span className="text-[11px] text-muted flex items-center gap-1.5">
            Confidence <b className="text-accent-teal font-semibold">{data!.brief.confidence}</b>
            <span className="text-border">·</span>
            {data!.brief.sourceCount} {data!.brief.sourceCount === 1 ? 'source' : 'sources'}
          </span>
        </div>

        <p className="font-serif text-[16px] leading-relaxed text-light mb-4">
          {data!.brief.summary}
        </p>

        {data!.brief.flags.length > 0 && (
          <div className="space-y-2.5">
            {data!.brief.flags.map((fl, i) => {
              const meta = CATEGORY_META[fl.category]
              return (
                <div key={i} className="flex gap-3 items-start text-sm text-light/90 leading-snug">
                  <span
                    className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border mt-0.5"
                    style={{ color: meta.color, borderColor: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span>{fl.text}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Feed header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-serif text-xl text-light flex items-center gap-2.5">
          Relevant News
          <span className="font-sans text-xs font-semibold text-muted bg-navy border border-border rounded-full px-2.5 py-0.5">
            {data!.articles.length} {data!.articles.length === 1 ? 'story' : 'stories'}
          </span>
        </h3>
        <button
          onClick={pull}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-light border border-border hover:border-accent-orange/40 rounded-lg px-3 py-1.5 transition-all duration-[1200ms] active:scale-[0.97]"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Empty / sparse state */}
      {data!.sparse && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-light font-medium mb-1">No clearly-matching coverage found.</p>
          <p className="text-xs text-muted">
            {data!.note ?? 'This company has a thin or ambiguous news footprint. That itself can be useful signal for an indie target.'}
          </p>
        </div>
      )}

      {/* Category filters */}
      {!data!.sparse && (
        <div className="flex flex-wrap gap-2">
          <FilterChip
            label="All" count={data!.articles.length}
            active={activeCat === 'all'} color="#DFD5CC"
            onClick={() => setActiveCat('all')}
          />
          {(Object.keys(CATEGORY_META) as NewsCategory[])
            .filter((c) => (catCounts[c] ?? 0) > 0)
            .map((c) => (
              <FilterChip
                key={c}
                label={CATEGORY_META[c].filterLabel}
                count={catCounts[c]!}
                color={CATEGORY_META[c].color}
                active={activeCat === c}
                onClick={() => setActiveCat(c)}
              />
            ))}
        </div>
      )}

      {/* Feed */}
      {!data!.sparse && (
        <div className="flex flex-col">
          {visible.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted">
              No {CATEGORY_META[activeCat as NewsCategory]?.filterLabel.toLowerCase()} coverage in this pull.
            </div>
          ) : (
            visible.map((a, i) => <ArticleRow key={a.url + i} article={a} />)
          )}
        </div>
      )}

      {/* Footnote */}
      <div className="flex items-center gap-2 pt-3 border-t border-border/60 text-[11px] text-muted">
        <Info size={13} className="shrink-0" />
        Gathered by live web search and ranked by source credibility &amp; recency. Each result is verified against the company&apos;s domain before inclusion.
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterChip({
  label, count, color, active, onClick,
}: { label: string; count: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-xs font-semibold rounded-full px-3.5 py-1.5 border transition-all duration-300 active:scale-[0.97] ${
        active
          ? 'text-navy border-transparent'
          : 'text-muted bg-card border-border hover:text-light hover:border-muted'
      }`}
      style={active ? { backgroundColor: color } : undefined}
    >
      {!active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {label}
      <span className={active ? 'text-navy/60' : 'text-muted/70 font-normal'}>{count}</span>
    </button>
  )
}

function ArticleRow({ article: a }: { article: NewsArticle }) {
  const meta = CATEGORY_META[a.category]
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-4 py-5 border-b border-border/40 hover:bg-light/[0.015] transition-colors px-1 -mx-1 rounded"
    >
      <span className="shrink-0 w-[3px] rounded self-stretch" style={{ backgroundColor: meta.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5 text-[11px]">
          <span className="font-bold uppercase tracking-wide text-[10.5px]" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-muted">·</span>
          <span className="font-semibold text-light/80 flex items-center gap-1.5">
            {a.source}
            <span
              className={`text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-px rounded ${
                a.tier === 't1'
                  ? 'text-accent-teal bg-accent-teal/10'
                  : 'text-muted bg-light/[0.04]'
              }`}
            >
              {TIER_LABEL[a.tier]}
            </span>
          </span>
          {a.ageLabel && (
            <>
              <span className="text-muted">·</span>
              <span className="text-muted">{a.ageLabel}</span>
            </>
          )}
        </div>
        <h4 className="font-serif text-[17px] leading-snug text-light group-hover:text-white transition-colors mb-1">
          {a.title}
        </h4>
        {a.snippet && <p className="text-sm text-muted leading-relaxed">{a.snippet}</p>}
      </div>
      <ArrowUpRight
        size={18}
        className="shrink-0 self-center text-muted opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </a>
  )
}
