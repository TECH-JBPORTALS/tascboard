'use client'

import {
  RiAddLine,
  RiArrowDownSFill,
  RiArrowDownSLine,
  RiCheckLine,
  RiExpandUpDownFill,
} from '@remixicon/react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { parseOrganizationMetadata } from '@/lib/organization'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { SidebarMenuButton } from '../ui/sidebar'
import { OrganizationAvatar } from './organizatoin-avatar'

type OrganizationListItem = {
  id: string
  name: string
  slug: string
  metadata?: string | Record<string, unknown> | null
}

type OrgComboValue = { slug: string; name: string }

export function OrganizationSwitcher() {
  const router = useRouter()
  const params = useParams<{ orgSlug: string }>()
  const [isSwitching, setIsSwitching] = useState(false)
  const { data: organizations, isPending } = authClient.useListOrganizations()
  const { data: session } = authClient.useSession()

  const orgList = (organizations ?? []) as OrganizationListItem[]
  const activeOrganizationId = session?.session.activeOrganizationId
  const current =
    orgList.find((org) => org.slug === params.orgSlug) ??
    orgList.find((org) => org.id === activeOrganizationId) ??
    orgList[0]

  const comboValue = useMemo<OrgComboValue | null>(
    () => (current ? { slug: current.slug, name: current.name } : null),
    [current],
  )

  async function switchOrganization(org: OrganizationListItem) {
    if (org.slug === params.orgSlug) {
      return
    }

    setIsSwitching(true)
    const result = await authClient.organization.setActive({
      organizationSlug: org.slug,
    })
    setIsSwitching(false)

    if (!result.error) {
      router.push(`/${org.slug}`)
      router.refresh()
    }
  }

  function handleOrganizationChange(slug: string) {
    if (!slug) {
      return
    }
    if (slug === params.orgSlug) {
      return
    }
    const org = orgList.find((o) => o.slug === slug)

    if (org) {
      void switchOrganization(org)
    }
  }

  if (isPending || isSwitching) {
    return (
      <div className="h-9 w-full animate-pulse rounded-lg bg-sidebar-accent" />
    )
  }

  if (!current || !comboValue) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start"
        render={<Link href="/create-organization" />}
      >
        <RiAddLine />
        Create organization
      </Button>
    )
  }

  const currentMetadata = parseOrganizationMetadata(current.metadata)

  return (
    <Popover>
      <SidebarMenuButton
        size={'sm'}
        className="max-w-44 w-fit px-1 gap-1.5"
        render={<PopoverTrigger />}
      >
        <OrganizationAvatar
          name={current.name}
          imageStorageId={currentMetadata.imageStorageId}
          className="size-5"
        />
        <span className="truncate text-left text-xs font-medium">
          {current.name}
        </span>
        <RiArrowDownSLine className="ml-auto text-muted-foreground" />
      </SidebarMenuButton>

      <PopoverContent className={'max-w-[240px]! p-0'}>
        <Command value={current.slug}>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No organization found</CommandEmpty>

            <CommandGroup heading={'Organizations'}>
              {orgList.map((org) => {
                const metadata = parseOrganizationMetadata(org.metadata)
                return (
                  <CommandItem
                    onSelect={() => handleOrganizationChange(org.slug)}
                    key={org.id}
                    value={org.slug}
                  >
                    <OrganizationAvatar
                      name={org.name}
                      imageStorageId={metadata.imageStorageId}
                      className="size-6"
                    />

                    {org.name}

                    {org.slug === current.slug && (
                      <RiCheckLine className="ml-auto" />
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
