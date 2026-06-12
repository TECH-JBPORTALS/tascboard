'use client'

import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import type { ReactNode } from 'react'
import { OrganizationRouteSkeleton } from './organization/org-route-skeleton'

/** Delays protected Convex subscriptions until the client has a Convex auth token. */
export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <OrganizationRouteSkeleton />
      </AuthLoading>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>Unauthenticated</Unauthenticated>
    </>
  )
}
