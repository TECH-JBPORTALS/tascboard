import z from 'zod'

const emailSchema = z.string().email()

export function parseEmails(raw: string): string[] {
  const parts = raw
    .split(/[\s,;]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

  return [...new Set(parts)]
}

export function validateEmails(emails: string[]): {
  valid: string[]
  invalid: string[]
} {
  const valid: string[] = []
  const invalid: string[] = []

  for (const email of emails) {
    if (emailSchema.safeParse(email).success) {
      valid.push(email)
    } else {
      invalid.push(email)
    }
  }

  return { valid, invalid }
}
