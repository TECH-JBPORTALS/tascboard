'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Button } from './ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card'
import { Field, FieldDescription, FieldError } from './ui/field'

function normalizeEmail(email: string | null): string {
  return email?.trim().toLowerCase() ?? ''
}

export function VerifyEmailPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const email = useMemo(() => {
    return normalizeEmail(searchParams.get('email'))
  }, [searchParams])

  const canResend = email.length > 0

  async function handleResendEmail() {
    if (!canResend) {
      setErrorMessage('Missing email address. Please sign in again.')
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/',
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMessage(error.message ?? 'Failed to resend verification email.')
      return
    }

    toast.success('Verification email sent.')
  }

  return (
    <section className="h-svh flex items-center justify-center">
      <Card className="min-w-sm max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            You must verify your email address before accessing Tascboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldDescription>
              {email
                ? `We sent a verification link to ${email}.`
                : 'No email address was found in this link.'}
            </FieldDescription>
          </Field>
          {errorMessage && (
            <Field>
              <FieldError errors={[{ message: errorMessage }]} />
            </Field>
          )}
          <Field>
            <Button
              className="w-full"
              disabled={!canResend || isSubmitting}
              onClick={handleResendEmail}
              type="button"
            >
              {isSubmitting
                ? 'Resending verification...'
                : 'Resend verification email'}
            </Button>
          </Field>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p className="text-sm">
            <Link
              href="/sign-in"
              className="hover:underline text-primary/80 hover:text-primary"
            >
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </section>
  )
}
