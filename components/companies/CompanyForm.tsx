'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { FieldSchema, Company, AirtableFieldValue } from '@/types'

interface CompanyFormProps {
  company?: Company
}

type FormValues = Record<string, string>

function valueToString(v: AirtableFieldValue): string {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}

function stringToAirtableValue(raw: string, type: FieldSchema['type']): AirtableFieldValue {
  if (raw.trim() === '') return null
  if (type === 'number') {
    const n = parseFloat(raw)
    return isNaN(n) ? null : n
  }
  if (type === 'boolean') return raw === 'true'
  if (type === 'multiselect') return raw.split(',').map((s) => s.trim()).filter(Boolean)
  return raw
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter()
  const isEditing = !!company

  const [schema, setSchema] = useState<FieldSchema[]>([])
  const [values, setValues] = useState<FormValues>({})
  const [loadingSchema, setLoadingSchema] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/airtable/schema')
      .then((r) => r.json())
      .then((fields: FieldSchema[]) => {
        // Exclude read-only linked fields from the form
        const editable = fields.filter((f) => f.type !== 'linked')
        setSchema(editable)
        const initial: FormValues = {}
        editable.forEach((f) => {
          initial[f.name] = isEditing ? valueToString(company.fields[f.name]) : ''
        })
        setValues(initial)
      })
      .catch(() => toast.error('Failed to load form fields'))
      .finally(() => setLoadingSchema(false))
  }, [company, isEditing])

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const fields: Record<string, AirtableFieldValue> = {}
    schema.forEach((f) => {
      const coerced = stringToAirtableValue(values[f.name] ?? '', f.type)
      if (coerced !== null) fields[f.name] = coerced
    })

    try {
      const url    = isEditing ? `/api/companies/${company.id}` : '/api/companies'
      const method = isEditing ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Request failed')
      }
      const saved: Company = await res.json()
      toast.success(isEditing ? 'Company updated!' : 'Company created!')
      router.push(`/companies/${saved.id}`)
      router.refresh()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingSchema) return <PageLoader message="Loading form…" />

  if (schema.length === 0) {
    return (
      <p className="text-sm text-muted text-center py-12">
        No editable fields found. Make sure your Airtable table has at least one record.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {schema.map((field) => {
        const value = values[field.name] ?? ''

        if (field.type === 'select' && field.options) {
          return (
            <Select
              key={field.name}
              label={field.name}
              options={field.options}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          )
        }

        if (field.type === 'boolean') {
          return (
            <div key={field.name} className="flex items-center gap-3">
              <input type="checkbox" id={field.name}
                checked={value === 'true'}
                onChange={(e) => handleChange(field.name, String(e.target.checked))}
                className="w-4 h-4 rounded bg-[#111827] border-border text-accent-orange focus:ring-accent-orange"
              />
              <label htmlFor={field.name} className="text-sm text-light">{field.name}</label>
            </div>
          )
        }

        if (field.type === 'textarea') {
          return (
            <Textarea key={field.name} label={field.name}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}…`}
            />
          )
        }

        const inputType =
          field.type === 'number' ? 'number' :
          field.type === 'url'    ? 'url'    :
          field.type === 'email'  ? 'email'  :
          field.type === 'date'   ? 'date'   : 'text'

        return (
          <Input key={field.name} label={field.name}
            type={inputType}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={`Enter ${field.name.toLowerCase()}…`}
          />
        )
      })}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {isEditing ? 'Save Changes' : 'Add to Target List'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
