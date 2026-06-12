'use client'

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react'
import { ConvexReactClient } from 'convex/react'
import { ReactNode } from 'react'
import { authClient } from '@/lib/auth-client'
import { ConvexQueryCacheProvider } from 'convex-helpers/react/cache/provider'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function ConvexClientProvider({
  children,
  initialToken,
}: {
  children: ReactNode
  initialToken?: string | null
}) {
  return (
    <ConvexBetterAuthProvider
      client={convex}
      authClient={authClient}
      initialToken={initialToken}
    >
      <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
    </ConvexBetterAuthProvider>
  )
}
