import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { AirtableFieldValue, FieldType } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Infer field type from a raw Airtable value (fallback when Metadata API unavailable) */
export function inferFieldType(value: AirtableFieldValue): FieldType {
  if (value === null || value === undefined) return 'text'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'multiselect'
  if (typeof value === 'string') {
    if (value.match(/^https?:\/\//i)) return 'url'
    if (value.match(/^\S+@\S+\.\S+$/)) return 'email'
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date'
    if (value.length > 150) return 'textarea'
  }
  return 'text'
}

/** Format any Airtable field value for display */
export function formatFieldValue(value: AirtableFieldValue): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

/** Format a currency/revenue value — handles both numbers and pre-formatted strings like "$20.0" */
export function formatRevenue(value: AirtableFieldValue): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string') {
    // Already formatted (e.g. "$20.0") — append M if not already there
    if (value.startsWith('$')) return value.endsWith('M') ? value : `${value}M`
    const n = parseFloat(value)
    if (!isNaN(n)) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}M`
    return value
  }
  if (typeof value === 'number') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}M`
  }
  return String(value)
}

/** Return a Tailwind class string for a Phase badge */
export function getPhaseStyle(phase: string): string {
  const map: Record<string, string> = {
    'Research':                 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Going to NDA':             'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'NDA':                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'IOI':                      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Initial Diligence':        'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Full Diligence':           'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Data Room Created':        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Confirmatory Diligence':   'bg-green-500/10 text-green-400 border-green-500/20',
    'Long Form Docs':           'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Revisit':                  'bg-slate-500/10 text-slate-400 border-slate-500/20',
    'Pass':                     'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return map[phase] ?? 'bg-card text-muted border-border'
}

/**
 * Strip Airtable richText/markdown formatting to get a plain URL.
 * Handles: [text](url), <url>, plain URLs, trailing whitespace/newlines.
 */
export function extractUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  const s = raw.trim()
  // Markdown link: [text](url)
  const md = s.match(/\[.*?\]\(([^)]+)\)/)
  if (md) return md[1].trim().replace(/%20$/, '').trimEnd()
  // Angle bracket: <url>
  const ab = s.match(/^<([^>]+)>/)
  if (ab) return ab[1].trim()
  return s
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}

export function truncate(str: string, max = 60): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1) + '…'
}

export function getCompanyName(
  fields: Record<string, AirtableFieldValue>
): string {
  const nameCandidates = ['Company', 'Name', 'Company Name', 'Organization', 'Title']
  for (const key of nameCandidates) {
    if (fields[key] && typeof fields[key] === 'string') return fields[key] as string
  }
  for (const val of Object.values(fields)) {
    if (typeof val === 'string' && val.length > 0) return val
  }
  return 'Unnamed Company'
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-pink-600',
    'bg-indigo-600', 'bg-teal-600', 'bg-orange-600', 'bg-red-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
