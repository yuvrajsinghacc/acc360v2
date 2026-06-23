import { CompanyForm } from '@/components/companies/CompanyForm'

export default function NewCompanyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-light">Add Company</h1>
        <p className="text-muted text-sm mt-1">
          Fill in the details below. The form fields are pulled directly from
          your Airtable table schema.
        </p>
      </div>
      <CompanyForm />
    </div>
  )
}
