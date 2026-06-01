'use client'

import { RiAddLine, RiArrowDownSLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { authClient } from '@/lib/auth-client'
import { parseOrganizationMetadata } from '@/lib/organization'
import {
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '../ui/menubar'
import { SidebarMenuButton, SidebarMenuSkeleton } from '../ui/sidebar'
import { OrganizationAvatar } from './organizatoin-avatar'

export function OrganizationSwitcher() {
  const router = useRouter()
  const params = useParams<{ orgSlug: string }>()
  const [isSwitching, setIsSwitching] = useState(false)
  const {
    data: organizations,
    isPending,
    isRefetching,
  } = authClient.useListOrganizations()
  const setActiveOrganization = useMutation(api.auth.setActiveOrganization)
  const activeOrganization = useQuery(api.auth.getActiveOrganization)

  const current = organizations?.find(
    (org) => org.id === activeOrganization?.id,
  )

  async function switchOrganization(
    org: NonNullable<typeof organizations>[number],
  ) {
    if (org.slug === params.orgSlug || !org.id) {
      return
    }

    setIsSwitching(true)
    const result = await setActiveOrganization({
      organizationId: org.id,
    })
    if (result) {
      router.push(`/${result.slug}`)
      
    }
    setIsSwitching(false)
  }

  if (current === undefined || isSwitching || isPending || isRefetching) {
    return <SidebarMenuSkeleton className="w-full" />
  }

  if (current === null || organizations === null) {
    router.replace('/')
    return null
  }

  const currentMetadata = parseOrganizationMetadata(current?.metadata)

  return (
    <MenubarMenu>
      <MenubarTrigger
        render={
          <SidebarMenuButton
            variant={'outline'}
            className="w-full bg-sidebar-accent/50"
          />
        }
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
      </MenubarTrigger>

      <MenubarContent className={'min-w-60 backdrop-blur-sm'}>
        <MenubarGroup>
          <MenubarItem render={<Link href={`/${params.orgSlug}/settings`} />}>
            Settings
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Switch organization</MenubarSubTrigger>
            <MenubarSubContent className={'min-w-52 backdrop-blur-xs'}>
              <MenubarRadioGroup
                value={current}
                onValueChange={(org) => void switchOrganization(org)}
              >
                <MenubarLabel>Your organizations</MenubarLabel>
                {organizations.map((org) => (
                  <MenubarRadioItem inset value={org} key={org.id}>
                    <OrganizationAvatar
                      name={org.name}
                      imageStorageId={
                        parseOrganizationMetadata(org.metadata).imageStorageId
                      }
                      className="size-5!"
                    />
                    {org.name}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
              <MenubarGroup>
                <MenubarLabel>Account</MenubarLabel>
                <MenubarItem render={<Link href={'/create-organization'} />}>
                  <RiAddLine />
                  Create new organization...
                </MenubarItem>
              </MenubarGroup>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />

          <MenubarGroup>
            <MenubarItem
              nativeButton={false}
              onClick={() =>
                void authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = '/sign-in'
                    },
                  },
                })
              }
            >
              Log out
            </MenubarItem>
          </MenubarGroup>
        </MenubarGroup>
      </MenubarContent>
    </MenubarMenu>
  )
}
