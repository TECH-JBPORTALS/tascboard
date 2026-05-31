'use client'

import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client'
import { RiTBoxLine } from '@remixicon/react'
import { type Preloaded } from 'convex/react'
import { useParams, useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useMemo } from 'react'
import { OrganizationAccessProvider } from '@/components/organization/organization-access-provider'
import { api } from '@/convex/_generated/api'
import { findOrganizationBySlug } from '@/lib/organization-membership'

export function OrganizationRouteSkeleton() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3 p-6">
      <RiTBoxLine className="size-16 text-primary dark:text-muted-foreground" />
      <div className="flex">
        <span className="text-muted-foreground text-sm">
          Loading workspace...
        </span>
        <span className="animate-caret-blink h-4 mx-1 w-1 bg-primary dark:bg-foreground" />
      </div>
    </div>
  )
}

type OrgSlugGuardProps = {
  /** Omit on `/` (home); provide under `/[orgSlug]/*` layouts. */
  children?: ReactNode
  preloadedOrganizationsQuery: Preloaded<typeof api.auth.listOrganizations>
  preloadedActiveOrganizationQuery: Preloaded<
    typeof api.auth.getActiveOrganization
  >
  preloadedMemberRoleQuery?: Preloaded<typeof api.auth.getActiveMemberRole>
}

/**
 * Organization routing for authenticated app shell:
 * - `/` — resolve destination (create / select / active org) and redirect
 * - `/[orgSlug]/*` — ensure slug is valid, sync active org, then render children
 */
export function OrgSlugGuard({
  children,
  preloadedOrganizationsQuery,
  preloadedActiveOrganizationQuery,
  preloadedMemberRoleQuery,
}: OrgSlugGuardProps) {
  const router = useRouter()
  const params = useParams<{ orgSlug?: string }>()
  const orgSlug = params.orgSlug
  const isHomeRoute = orgSlug === undefined

  const organizations = usePreloadedAuthQuery(preloadedOrganizationsQuery)
  const activeOrganization = usePreloadedAuthQuery(
    preloadedActiveOrganizationQuery,
  )

  const orgList = useMemo(() => organizations ?? [], [organizations])

  const org = useMemo(
    () => (isHomeRoute ? undefined : findOrganizationBySlug(orgList, orgSlug)),
    [isHomeRoute, orgList, orgSlug],
  )

  useEffect(() => {
    if (isHomeRoute) {
      if (!activeOrganization?.slug) {
        router.replace('/select-organization')
        return
      }
      router.replace(`/${activeOrganization?.slug}`)
    }

    if (org) {
      return
    }

    router.replace(`/${activeOrganization?.slug}`)
  }, [activeOrganization?.slug, isHomeRoute, org, router])

  if (isHomeRoute) {
    return <OrganizationRouteSkeleton />
  }

  if (!org) {
    return <OrganizationRouteSkeleton />
  }

  if (preloadedMemberRoleQuery) {
    return (
      <OrganizationAccessProvider
        preloadedMemberRoleQuery={preloadedMemberRoleQuery}
      >
        {children}
      </OrganizationAccessProvider>
    )
  }

  return <>{children}</>
}
