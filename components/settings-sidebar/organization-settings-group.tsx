'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { authClient } from '@/lib/auth-client'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '../ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { RiBuilding2Fill } from '@remixicon/react'
import { OrganizationAvatar } from '../organization/organizatoin-avatar'

export function OrganizationsSettingsGroup() {
  const pathname = usePathname()
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const basePath = `/${orgSlug}`
  const { data: organizations, isPending } = authClient.useListOrganizations()
  const [createOpen, setCreateOpen] = useState(false)

  const getOrganizationActiveState = useMemo(
    () => (href: string) =>
      pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Organizations</SidebarGroupLabel>
      <SidebarContent>
        <SidebarMenu>
          {isPending &&
            Array.from({ length: 10 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuSkeleton />
              </SidebarMenuItem>
            ))}
          {organizations?.map((organization) => {
            const href = `${basePath}/settings/o/${organization.id}`
            const isActive = getOrganizationActiveState(href)

            return (
              <SidebarMenuItem key={organization.id}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={{ children: organization.name }}
                  size="sm"
                  render={<Link href={href} />}
                >
                  <OrganizationAvatar
                    name={organization.name}
                    imageStorageId={organization.metadata?.imageStorageId}
                    className="size-4! [&_svg]:size-2.5!"
                  />

                  <span className="truncate">{organization.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarGroup>
  )
}
