'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FieldError } from '@/components/ui/field'
import { authClient } from '@/lib/auth-client'

export function SessionSettingsSection() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    if (isSigningOut) {
      return
    }

    setError(null)
    setIsSigningOut(true)

    const result = await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace('/sign-in')
          router.refresh()
        },
      },
    })

    setIsSigningOut(false)

    if (result.error) {
      setError(result.error.message ?? 'Failed to sign out of this session')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session</CardTitle>
        <CardDescription>
          Log out from your current session on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <FieldError errors={[{ message: error }]} /> : null}
        <Button
          type="button"
          variant="outline"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
        >
          {isSigningOut ? 'Logging out...' : 'Log out'}
        </Button>
      </CardContent>
    </Card>
  )
}
