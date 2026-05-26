'use client'

import { authClient } from '@/lib/auth-client'

export function useActor() {
  const { data: session } = authClient.useSession()
  const user = session?.user

  return {
    deviceName: user?.id ?? 'anonymous',
    displayName: user?.name?.trim() || user?.email?.trim() || 'Someone',
  }
}
