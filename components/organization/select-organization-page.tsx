'use client'

import { RiAddLine, RiArrowRightLine } from '@remixicon/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { authClient } from '@/lib/auth-client'
import { parseOrganizationMetadata } from '@/lib/organization'
import {
  type OrganizationListItem,
  resolveOrganizationDestination,
} from '@/lib/organization-membership'
import { OrganizationAvatar } from './organizatoin-avatar'

export function SelectOrganizationPage() {
  const router = useRouter()
  const { data: organizations, isPending: orgsPending } =
    authClient.useListOrganizations()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const orgList = useMemo(
    () => (organizations ?? []) as OrganizationListItem[],
    [organizations],
  )
  const activeOrganizationId = session?.session.activeOrganizationId
  const isLoading = orgsPending || sessionPending

  useEffect(() => {
    if (isLoading) return

    const destination = resolveOrganizationDestination(
      orgList,
      activeOrganizationId,
    )

    if (destination.type === 'create') {
      router.replace('/create-organization')
      return
    }

    if (destination.type === 'organization') {
      const { id, slug } = destination.organization

      if (activeOrganizationId === id) {
        router.replace(`/${slug}`)
        return
      }

      let cancelled = false
      void (async () => {
        await authClient.organization.setActive({
          organizationId: id,
        })
        if (!cancelled) {
          router.replace(`/${slug}`)
        }
      })()

      return () => {
        cancelled = true
      }
    }
  }, [activeOrganizationId, isLoading, orgList, router])

  async function handleSelect(org: OrganizationListItem) {
    setError(null)
    setSelectingId(org.id)

    try {
      const result = await authClient.organization.setActive({
        organizationId: org.id,
      })

      if (result.error) {
        setError(result.error.message ?? 'Could not switch organization')
        return
      }

      router.replace(`/${org.slug}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not switch organization')
    } finally {
      setSelectingId(null)
    }
  }

  if (isLoading || orgList.length <= 1) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    )
  }

  const destination = resolveOrganizationDestination(
    orgList,
    activeOrganizationId,
  )
  if (destination.type !== 'select') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Choose an organization</CardTitle>
          <CardDescription>
            Select which organization you want to work in. You can switch
            anytime from the sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <ul className="flex flex-col gap-2">
            {orgList.map((org) => {
              const metadata = parseOrganizationMetadata(org.metadata)
              const isActive = org.id === activeOrganizationId
              const isSelecting = selectingId === org.id

              return (
                <li key={org.id}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 px-3 py-3"
                    disabled={selectingId !== null}
                    onClick={() => void handleSelect(org)}
                  >
                    <OrganizationAvatar
                      name={org.name}
                      imageStorageId={metadata.imageStorageId}
                      className="size-10 shrink-0"
                    />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-medium">
                        {org.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {org.slug}
                        {isActive ? ' · Current' : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {isSelecting ? 'Opening...' : <RiArrowRightLine />}
                    </span>
                  </Button>
                </li>
              )
            })}
          </ul>
          <Button
            variant="ghost"
            className="mt-2 w-full"
            render={<Link href="/create-organization" />}
            nativeButton={false}
          >
            <RiAddLine />
            Create another organization
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
