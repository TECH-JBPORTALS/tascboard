'use client'

import { Authenticated, AuthLoading } from 'convex/react'
import { ConvexQueryCacheProvider } from 'convex-helpers/react/cache/provider'
import type { ReactNode } from 'react'
import { OrganizationRouteSkeleton } from './organization/org-slug-guard'

/** Delays protected Convex subscriptions until the client has a Convex auth token. */
export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <OrganizationRouteSkeleton />
      </AuthLoading>
      <Authenticated>
        <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
      </Authenticated>
    </>
  )
}
