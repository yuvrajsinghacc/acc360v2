#!/usr/bin/env tsx
/**
 * One-time data cleanup: moves email + title out of the free-text Contact field
 * into their dedicated fields for every "On Hot List" record in Airtable.
 *
 * Usage:
 *   npx tsx scripts/cleanup-hotlist-contacts.ts           # dry-run (default, no writes)
 *   npx tsx scripts/cleanup-hotlist-contacts.ts --apply   # write to Airtable
 *
 * Requires: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME in .env.local
 */

import Airtable from 'airtable'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Load .env.local (no dotenv dep required) ──────────────────────────────────
try {
  const raw = readFileSync(join(process.cwd(), '.env.local'), 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
} catch {
  // .env.local absent — fall through; env vars may already be set in the shell
}

// ── Config ────────────────────────────────────────────────────────────────────
const API_KEY    = process.env.AIRTABLE_API_KEY
const BASE_ID    = process.env.AIRTABLE_BASE_ID
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME

if (!API_KEY || !BASE_ID || !TABLE_NAME) {
  console.error('ERROR: Missing required env vars: AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME')
  process.exit(1)
}

const DRY_RUN  = !process.argv.includes('--apply')
const TABLE_ID = 'tblAykS2yAML1BTJ2'   // "Merged List" — verified

// Field IDs (confirmed against live schema)
const F_COMPANY = 'fldrQ2bq0JHVEfKt2'  // Company name
const F_HOTLIST = 'fld0zQPtjlWQDQwnx'  // On Hot List (checkbox)
const F_CONTACT = 'fldP5AdJ9zdLfVZ5P'  // Contact (free text — source of bad data)
const F_EMAIL   = 'fld75f5AG3n7QEXBp'  // Email (dedicated)
const F_TITLE   = 'fldsyd6C2Tm3yhJDY'  // Title (singleSelect — dedicated)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Airtable REST helpers ─────────────────────────────────────────────────────

function headers() {
  return { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
}

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

interface AirtableRecord {
  id: string
  fields: Record<string, unknown>
}

function getBase() {
  return new Airtable({ apiKey: API_KEY }).base(BASE_ID!)
}

async function fetchHotListRecords(): Promise<AirtableRecord[]> {
  const raw = await getBase()(TABLE_NAME!).select({
    filterByFormula: `{On Hot List}`,
    fields: [F_COMPANY, F_CONTACT, F_EMAIL, F_TITLE],
    // returnFieldsByFieldId means the response keys fields by fldXXX id, not name
    returnFieldsByFieldId: true,
  } as any).all() as any[]

  return raw.map((r: any) => ({ id: r.id as string, fields: r.fields as Record<string, unknown> }))
}

/** Returns a Set of existing singleSelect option names for the Title field. */
async function fetchTitleOptions(): Promise<Set<string>> {
  const res = await fetch(
    `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`,
    { headers: headers() }
  )
  if (!res.ok) throw new Error(`Fetch schema failed (${res.status}): ${await res.text()}`)
  const data = await res.json() as { tables: Array<{ id: string; fields: Array<{ id: string; options?: { choices: Array<{ name: string }> } }> }> }

  const table = data.tables.find(t => t.id === TABLE_ID)
  const field = table?.fields.find(f => f.id === F_TITLE)
  const options = new Set<string>()
  for (const choice of field?.options?.choices ?? []) {
    options.add(choice.name)
  }
  return options
}

/** PATCH a single record. Throttled to stay under Airtable's 5 req/sec limit. */
async function patchRecord(recordId: string, fields: Record<string, unknown>): Promise<void> {
  await sleep(220)   // ~4.5 req/sec to stay safely under the 5 req/sec limit
  await (getBase()(TABLE_NAME!) as any).update(recordId, fields)
}

// ── Contact field parser ──────────────────────────────────────────────────────

type ParseAction =
  | { action: 'clean' }
  | { action: 'skip';   reason: string }
  | { action: 'update'; name: string; email: string | null; title: string | null }

/**
 * Attempts to extract email + title from a crammed Contact field value.
 *
 * Conservative rules:
 *  - 0 emails in Contact → already clean, nothing to do
 *  - >1 emails           → multiple contacts, skip
 *  - 1 email + 0 text    → no name to restore, skip
 *  - 1 email + >1 text   → multiple contacts, skip
 *  - 1 email + 1 text    → try "Name, Title" split; if ambiguous, skip
 *
 * Never overwrites a field that already has a value.
 */
function parseContact(
  contactRaw: string,
  existingEmail: string,
  existingTitle: string
): ParseAction {
  const lines      = contactRaw.split('\n').map(l => l.trim()).filter(Boolean)
  const emailLines = lines.filter(l => EMAIL_RE.test(l))
  const textLines  = lines.filter(l => !EMAIL_RE.test(l))

  // No email in Contact → field is already clean (name-only or empty)
  if (emailLines.length === 0) {
    if (textLines.length <= 1) return { action: 'clean' }
    return { action: 'skip', reason: 'Multiple text lines, no email — ambiguous; could be multiple contacts' }
  }

  // Multiple emails → multiple contacts, not safe to auto-process
  if (emailLines.length > 1) {
    return { action: 'skip', reason: `${emailLines.length} email addresses found — likely multiple contacts` }
  }

  // Exactly one email from here on
  const parsedEmail = emailLines[0]

  // Conflict: Contact email differs from already-set Email field
  if (existingEmail && existingEmail !== parsedEmail) {
    return {
      action: 'skip',
      reason: `Email field already has a different value ("${existingEmail}") — won't overwrite`,
    }
  }

  // No text lines → Contact is an email only, no name to restore
  if (textLines.length === 0) {
    return {
      action: 'skip',
      reason: existingEmail
        ? `Contact contains only an email; Email field already set ("${existingEmail}") — clean Contact manually (we don't know the person's name)`
        : 'Contact contains only an email with no associated name — cannot determine what to put back in Contact',
    }
  }

  // Multiple text lines → multiple contacts or unexpected structure
  if (textLines.length > 1) {
    return {
      action: 'skip',
      reason: `${textLines.length} non-email text lines found — likely multiple contacts`,
    }
  }

  // Exactly 1 email + 1 text line — this is the processable case
  const textLine = textLines[0]
  const commaIdx = textLine.indexOf(',')

  let name: string
  let title: string | null = null

  if (commaIdx > 0) {
    name  = textLine.slice(0, commaIdx).trim()
    title = textLine.slice(commaIdx + 1).trim() || null

    // Basic sanity: name should look like a person's name
    if (!name || name.includes('@') || name.length > 80) {
      return { action: 'skip', reason: `Cannot confidently parse a person name from: "${textLine}"` }
    }
    if (title && title.length > 100) {
      return { action: 'skip', reason: `Parsed title is implausibly long from: "${textLine}"` }
    }
  } else {
    // No comma — text line is just a name, no title embedded
    name  = textLine
    title = null
  }

  // Respect existing field values — never overwrite
  const emailToSet = existingEmail ? null : parsedEmail
  const titleToSet = (title && !existingTitle) ? title : null

  return { action: 'update', name, email: emailToSet, title: titleToSet }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log()
  console.log('════════════════════════════════════════════════════════')
  console.log('  ACC360 — Hot List Contact Field Cleanup')
  console.log(`  Mode: ${DRY_RUN ? 'DRY-RUN (read-only, no writes)' : '⚠️  APPLY — will write to Airtable'}`)
  console.log('════════════════════════════════════════════════════════')
  console.log()

  console.log('Fetching Hot List records and Title field schema...')
  const [records, titleOptions] = await Promise.all([
    fetchHotListRecords(),
    fetchTitleOptions(),
  ])
  console.log(`  → ${records.length} Hot List records found`)
  console.log(`  → ${titleOptions.size} existing Title select options`)
  console.log()

  // ── Classify each record ───────────────────────────────────────────────────

  type UpdatePlan = {
    record: AirtableRecord
    company: string
    before: { contact: string; email: string; title: string }
    after:  { contact: string; email: string; title: string }
    newTitleOption: string | null   // option name to create, if not already in schema
  }

  const toUpdate: UpdatePlan[]                              = []
  const skipped: { company: string; id: string; reason: string }[] = []
  const clean:   { company: string; id: string }[]         = []

  for (const record of records) {
    const company      = String(record.fields[F_COMPANY] ?? '').trim()
    const contactRaw   = String(record.fields[F_CONTACT] ?? '')
    const existingEmail = String(record.fields[F_EMAIL]  ?? '').trim()

    // singleSelect fields come back as { id, name, color } objects
    const titleField = record.fields[F_TITLE]
    const existingTitle = titleField && typeof titleField === 'object'
      ? String((titleField as { name: string }).name ?? '').trim()
      : String(titleField ?? '').trim()

    const result = parseContact(contactRaw, existingEmail, existingTitle)

    if (result.action === 'clean') {
      clean.push({ company, id: record.id })
      continue
    }
    if (result.action === 'skip') {
      skipped.push({ company, id: record.id, reason: result.reason })
      continue
    }

    // action === 'update'
    const newTitleOption = result.title && !titleOptions.has(result.title)
      ? result.title
      : null

    toUpdate.push({
      record,
      company,
      before: { contact: contactRaw, email: existingEmail, title: existingTitle },
      after:  {
        contact: result.name,
        email:   result.email ?? existingEmail,
        title:   result.title ?? existingTitle,
      },
      newTitleOption,
    })
  }

  // ── Print proposed changes ─────────────────────────────────────────────────

  if (toUpdate.length > 0) {
    console.log(`── RECORDS TO UPDATE (${toUpdate.length}) ──────────────────────────────────`)
    console.log()
    for (const item of toUpdate) {
      console.log(`  Company   : ${item.company}`)
      console.log(`  Record ID : ${item.record.id}`)
      const bContact = item.before.contact.replace(/\n/g, '\\n')
      console.log(`  Contact   : "${bContact}"`)
      console.log(`            → "${item.after.contact}"`)
      const bEmail = item.before.email || '(empty)'
      const aEmail = item.after.email  || '(no change)'
      console.log(`  Email     : "${bEmail}" → "${aEmail}"`)
      const bTitle = item.before.title || '(empty)'
      const aTitle = item.after.title  || '(no change)'
      console.log(`  Title     : "${bTitle}" → "${aTitle}"`)
      if (item.newTitleOption) {
        console.log(`  ⚠  NEW Title option will be created: "${item.newTitleOption}"`)
      }
      console.log()
    }
  }

  if (skipped.length > 0) {
    console.log(`── SKIPPED — NEEDS MANUAL REVIEW (${skipped.length}) ───────────────────────`)
    console.log()
    for (const s of skipped) {
      console.log(`  ${s.company}`)
      console.log(`  Record ID : ${s.id}`)
      console.log(`  Reason    : ${s.reason}`)
      console.log()
    }
  }

  if (clean.length > 0) {
    console.log(`── ALREADY CLEAN — NO ACTION NEEDED (${clean.length}) ──────────────────────`)
    console.log()
    for (const c of clean) {
      console.log(`  ${c.company} (${c.id})`)
    }
    console.log()
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const allNewOptions = Array.from(new Set(toUpdate.map(u => u.newTitleOption).filter(Boolean)))

  console.log('── SUMMARY ──────────────────────────────────────────────')
  console.log(`  Records to update        : ${toUpdate.length}`)
  console.log(`  Records skipped          : ${skipped.length}  (manual review needed)`)
  console.log(`  Records already clean    : ${clean.length}`)
  if (allNewOptions.length > 0) {
    console.log(`  New Title options needed : ${allNewOptions.join(', ')}`)
  } else {
    console.log(`  New Title options needed : none (all titles already exist as options)`)
  }
  console.log()

  if (DRY_RUN) {
    console.log('  Dry-run complete — no writes performed.')
    console.log('  Re-run with --apply to execute the changes above.')
    console.log()
    return
  }

  // ── Apply ──────────────────────────────────────────────────────────────────

  if (toUpdate.length === 0) {
    console.log('Nothing to apply.')
    return
  }

  console.log('Applying changes...')
  console.log()

  let successCount = 0
  const newOptionsCreated: string[] = []

  for (const item of toUpdate) {
    const fields: Record<string, unknown> = {}

    // Only include fields that actually change
    if (item.after.contact !== item.before.contact.trim()) {
      fields[F_CONTACT] = item.after.contact
    }
    if (item.after.email && item.after.email !== item.before.email) {
      fields[F_EMAIL] = item.after.email
    }
    if (item.after.title && item.after.title !== item.before.title) {
      // Airtable auto-creates new singleSelect options when a new string value is written
      fields[F_TITLE] = item.after.title
      if (item.newTitleOption) newOptionsCreated.push(item.newTitleOption)
    }

    if (Object.keys(fields).length === 0) {
      console.log(`  SKIP  ${item.company} — computed diff is empty (already in sync)`)
      continue
    }

    try {
      await patchRecord(item.record.id, fields)
      successCount++
      console.log(`  OK    ${item.company} (${item.record.id})`)
    } catch (err) {
      console.error(`  FAIL  ${item.company} (${item.record.id}): ${err}`)
    }
  }

  console.log()
  console.log(`Done. ${successCount}/${toUpdate.length} record(s) updated.`)
  if (newOptionsCreated.length > 0) {
    console.log(`New Title select options created: ${newOptionsCreated.join(', ')}`)
  }
  console.log()
}

main().catch(err => {
  console.error('Fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
