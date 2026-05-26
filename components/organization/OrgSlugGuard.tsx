'use client'

import { useParams, useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { authClient } from '@/lib/auth-client'
import {
  findOrganizationBySlug,
  type OrganizationListItem,
  organizationPath,
  resolveOrganizationDestination,
} from '@/lib/organization-membership'

function OrganizationRouteSkeleton() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  )
}

type OrgSlugGuardProps = {
  /** Omit on `/` (home); provide under `/[orgSlug]/*` layouts. */
  children?: ReactNode
}

/**
 * Organization routing for authenticated app shell:
 * - `/` — resolve destination (create / select / active org) and redirect
 * - `/[orgSlug]/*` — ensure slug is valid, sync active org, then render children
 */
export function OrgSlugGuard({ children }: OrgSlugGuardProps) {
  const router = useRouter()
  const params = useParams<{ orgSlug?: string }>()
  const orgSlug = params.orgSlug
  const isHomeRoute = orgSlug === undefined

  const { data: organizations, isPending: orgsPending } =
    authClient.useListOrganizations()
  const { data: session, isPending: sessionPending } = authClient.useSession()

  const activeOrganizationId = session?.session.activeOrganizationId
  const isLoading = orgsPending || sessionPending

  const orgList = useMemo(
    () => (organizations ?? []) as OrganizationListItem[],
    [organizations],
  )

  const org = useMemo(
    () =>
      isHomeRoute || isLoading
        ? undefined
        : findOrganizationBySlug(orgList, orgSlug),
    [isHomeRoute, isLoading, orgList, orgSlug],
  )

  const isActive =
    !isHomeRoute && org !== undefined && activeOrganizationId === org.id

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (isHomeRoute) {
      const destination = resolveOrganizationDestination(
        orgList,
        activeOrganizationId,
      )

      if (destination.type === 'organization') {
        const { id, slug } = destination.organization

        if (activeOrganizationId === id) {
          router.replace(`/${slug}`)
          return
        }

        void authClient.organization
          .setActive({ organizationId: id })
          .then(() => {
            router.replace(`/${slug}`)
          })
        return
      }

      router.replace(organizationPath(destination))
      return
    }

    if (!org) {
      const destination = resolveOrganizationDestination(
        orgList,
        activeOrganizationId,
      )
      router.replace(organizationPath(destination))
      return
    }

    if (activeOrganizationId === org.id) {
      return
    }

    void authClient.organization.setActive({
      organizationSlug: orgSlug,
    })
  }, [
    activeOrganizationId,
    isHomeRoute,
    isLoading,
    org,
    orgList,
    orgSlug,
    router,
  ])

  if (isHomeRoute) {
    return <OrganizationRouteSkeleton />
  }

  if (isLoading || !org || !isActive) {
    return <OrganizationRouteSkeleton />
  }

  return <>{children}</>
}
