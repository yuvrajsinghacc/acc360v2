import Anthropic from '@anthropic-ai/sdk'
import { Company } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function askClaude(userMessage: string, airtableRecords: Company[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are ACC360's internal assistant. You have access to the following company data from Airtable. Only answer questions based on this data, do not use external sources.

COMPANY DATA:
${JSON.stringify(airtableRecords)}`,
    messages: [
      {
        role: 'user',
        content: `${userMessage}`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type === 'text') return block.text
  return 'Unable to generate a response. Please try again.'
}
