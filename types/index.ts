// ─── Airtable Data Types ─────────────────────────────────────────────────────

export type AirtableFieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined

export interface Company {
  id: string
  fields: Record<string, AirtableFieldValue>
  createdTime?: string
}

// ─── Field Schema ─────────────────────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'multiselect'
  | 'url'
  | 'date'
  | 'email'
  | 'select'    // singleSelect — has options[]
  | 'linked'    // multipleRecordLinks — resolved to string, read-only in form

export interface FieldSchema {
  name: string
  type: FieldType
  options?: string[] // populated for 'select' type
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  details?: string
}
