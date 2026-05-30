'use client'

import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client'
import { type Preloaded } from 'convex/react'
import { createContext, type ReactNode, useContext, useMemo } from 'react'
import { api } from '@/convex/_generated/api'
import type { OrgRole } from '@/lib/permissions'

function isOrgRole(role: string): role is OrgRole {
  return role === 'owner' || role === 'employee'
}

type OrganizationAccessContextValue = {
  role: OrgRole | null
  isReady: boolean
}

const OrganizationAccessContext =
  createContext<OrganizationAccessContextValue | null>(null)

export function OrganizationAccessProvider({
  preloadedMemberRoleQuery,
  children,
}: {
  preloadedMemberRoleQuery: Preloaded<typeof api.auth.getActiveMemberRole>
  children: ReactNode
}) {
  const memberRole = usePreloadedAuthQuery(preloadedMemberRoleQuery)

  const value = useMemo((): OrganizationAccessContextValue => {
    if (memberRole === undefined) {
      return { role: null, isReady: false }
    }

    const rawRole = memberRole?.role
    const role = rawRole && isOrgRole(rawRole) ? rawRole : null

    return { role, isReady: true }
  }, [memberRole])

  return (
    <OrganizationAccessContext.Provider value={value}>
      {children}
    </OrganizationAccessContext.Provider>
  )
}

export function useOrganizationAccess() {
  const context = useContext(OrganizationAccessContext)

  if (!context) {
    throw new Error(
      'useOrganizationAccess must be used within OrganizationAccessProvider',
    )
  }

  return context
}
