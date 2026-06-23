'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { GitCompare, X, Search, ExternalLink } from 'lucide-react'
import { Company } from '@/types'
import { getCompanyName, formatFieldValue, getInitials, getAvatarColor } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { useApp } from '@/contexts/AppContext'

export default function ComparePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { compareIds, toggleCompare, clearCompare } = useApp()

  const urlIds = (searchParams.get('ids') ?? '').split(',').filter(Boolean)
  const idsToShow = urlIds.length > 0 ? urlIds : compareIds

  const [allCompanies, setAllCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((data: Company[]) => setAllCompanies(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selected = useMemo(
    () => allCompanies.filter((c) => idsToShow.includes(c.id)),
    [allCompanies, idsToShow]
  )

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allCompanies
      .filter((c) => !idsToShow.includes(c.id) && getCompanyName(c.fields).toLowerCase().includes(q))
      .slice(0, 8)
  }, [allCompanies, idsToShow, query])

  const allFields = useMemo(() => {
    const seen = new Set<string>()
    selected.forEach((c) => Object.keys(c.fields).forEach((k) => seen.add(k)))
    return Array.from(seen)
  }, [selected])

  const atMax = idsToShow.length >= 3

  function pick(id: string) {
    toggleCompare(id)
    setQuery('')
    setDropdownOpen(false)
  }

  if (loading) return <PageLoader message="Loading…" />

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light flex items-center gap-2">
            <GitCompare size={22} className="text-accent-orange" />
            Compare Companies
          </h1>
          <p className="text-muted text-sm mt-0.5">Select up to 3 companies to compare side by side</p>
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="sm:ml-auto"
            onClick={() => { clearCompare(); router.replace('/compare') }}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Search + selected pills */}
      <div className="space-y-3">
        {/* Search bar */}
        {!atMax && (
          <div ref={searchRef} className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search and add a company…"
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-light placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent-orange focus:border-transparent transition-colors"
            />
            {dropdownOpen && suggestions.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-[#111827] border border-border rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((c) => {
                  const name = getCompanyName(c.fields)
                  return (
                    <button
                      key={c.id}
                      onMouseDown={() => pick(c.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-card transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[11px] shrink-0 ${getAvatarColor(name)}`}>
                        {getInitials(name)}
                      </div>
                      <span className="text-sm text-light truncate">{name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected company pills */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((c) => {
              const name = getCompanyName(c.fields)
              return (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent-orange/10 border border-accent-orange/30 text-accent-orange"
                >
                  {name.length > 28 ? name.slice(0, 26) + '…' : name}
                  <button onClick={() => toggleCompare(c.id)} className="hover:text-white transition-colors">
                    <X size={11} />
                  </button>
                </span>
              )
            })}
            {atMax && (
              <span className="inline-flex items-center text-xs text-muted px-2 py-1.5">
                Max 3 companies
              </span>
            )}
          </div>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <GitCompare size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm mb-2">No companies selected</p>
          <p className="text-xs mb-6">Search for companies above or use the &ldquo;Compare&rdquo; button on company cards</p>
          <Link href="/companies">
            <Button variant="secondary">Browse Companies</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-[#111827]">
                <th className="text-left px-5 py-4 text-xs font-semibold text-muted uppercase tracking-wider w-44 sticky left-0 bg-[#111827]">
                  Field
                </th>
                {selected.map((company) => {
                  const name = getCompanyName(company.fields)
                  return (
                    <th key={company.id} className="px-5 py-4 text-left">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${getAvatarColor(name)}`}>
                          {getInitials(name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-light truncate max-w-[140px]">{name}</p>
                          <Link href={`/companies/${company.id}`} className="inline-flex items-center gap-0.5 text-xs text-muted hover:text-accent-orange">
                            View <ExternalLink size={10} />
                          </Link>
                        </div>
                        <button
                          onClick={() => toggleCompare(company.id)}
                          className="ml-auto text-muted hover:text-light shrink-0"
                          aria-label="Remove from comparison"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {allFields.map((field, i) => (
                <tr key={field} className={`border-b border-border/50 ${i % 2 === 0 ? 'bg-card/30' : 'bg-transparent'}`}>
                  <td className="px-5 py-3.5 sticky left-0 bg-inherit">
                    <span className="text-xs font-medium text-muted">{field}</span>
                  </td>
                  {selected.map((company) => {
                    const value = company.fields[field]
                    const display = formatFieldValue(value)
                    const isUrl = typeof value === 'string' && value.match(/^https?:\/\//i)
                    const isEmpty = display === '—'
                    return (
                      <td key={company.id} className="px-5 py-3.5">
                        {isUrl ? (
                          <a href={display} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent-orange hover:underline">
                            Link <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className={`text-sm ${isEmpty ? 'text-muted italic' : 'text-light'}`}>{display}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
