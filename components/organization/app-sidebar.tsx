'use client'

import {
  RiAddLargeFill,
  RiCalendarCheckFill,
  RiCalendarCheckLine,
  RiInboxFill,
  RiInboxLine,
  RiMoneyDollarCircleFill,
  RiMoneyDollarCircleLine,
  RiRouteLine,
  RiSettings3Line,
  RiTeamFill,
  RiTeamLine,
  RiTriangleFill,
} from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectIcon } from '@/components/projects/project-icon'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { api } from '@/convex/_generated/api'
import type { PermissionRequest } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { Protect } from '../auth/protect'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import { OrganizationSwitcher } from './organization-switcher'

const navItems = [
  { label: 'Inbox', href: '', icon: RiInboxLine, fillIcon: RiInboxFill },
  {
    label: 'Employees',
    href: '/employees',
    icon: RiTeamLine,
    fillIcon: RiTeamFill,
    permissions: { organization: ['delete'] },
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: RiCalendarCheckLine,
    fillIcon: RiCalendarCheckFill,
  },
  {
    label: 'Payroll',
    href: '/payroll',
    icon: RiMoneyDollarCircleLine,
    fillIcon: RiMoneyDollarCircleFill,
    permissions: { organization: ['delete'] },
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: RiSettings3Line,
    fillIcon: RiSettings3Line,
    permissions: { organization: ['delete'] },
  },
]

export function AppSidebar({
  className,
  showTooltip = false,
  ...props
}: React.ComponentProps<typeof Sidebar> & { showTooltip?: boolean }) {
  const pathname = usePathname()
  const params = useParams<{ orgSlug: string }>()
  const basePath = `/${params.orgSlug}`
  const unreadCount = useQuery(api.inbox.unreadCount)

  return (
    <Sidebar {...props} className={cn('group', className)}>
      <SidebarHeader className="p-2 h-14  justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <OrganizationSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ORGANIZATION</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const href = `${basePath}${item.href}`
                const isActive =
                  item.href === ''
                    ? pathname === basePath
                    : pathname.startsWith(href)

                const link = (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={{ children: item.label, hidden: !showTooltip }}
                      render={<Link href={href} />}
                    >
                      {isActive ? <item.fillIcon /> : <item.icon />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.label === 'Inbox' &&
                    typeof unreadCount === 'number' &&
                    unreadCount > 0 ? (
                      <SidebarMenuBadge className="bg-primary/15 text-primary">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                )

                if ('permissions' in item && item.permissions) {
                  return (
                    <Protect
                      key={item.label}
                      permissions={item.permissions as PermissionRequest}
                    >
                      {link}
                    </Protect>
                  )
                }

                return link
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects */}
        <ProjectSidebarGroup />
      </SidebarContent>
    </Sidebar>
  )
}

function ProjectSidebarGroup() {
  const pathname = usePathname()
  const params = useParams<{ orgSlug: string }>()
  const basePath = `/${params.orgSlug}`
  const projects = useQuery(api.project.list)
  const [createOpen, setCreateOpen] = useState(false)

  const getProjectActiveState = useMemo(
    () => (href: string) =>
      pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        PROJECTS
        <Protect permissions={{ project: ['create'] }}>
          <SidebarGroupAction
            title="Create project"
            onClick={() => setCreateOpen(true)}
          >
            <RiAddLargeFill />
          </SidebarGroupAction>
        </Protect>
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {projects?.map((pro) => {
            const href = `${basePath}/pro/${pro._id}`
            const isProjectActive = getProjectActiveState(href)
            const tracks = pro.tracks ?? []
            const hasTracks = tracks.length > 0

            return (
              <SidebarMenuItem key={pro._id} className="relative">
                <Collapsible>
                  <SidebarMenuButton
                    isActive={isProjectActive && !pathname.includes('/track/')}
                    tooltip={{ children: pro.name }}
                    render={<Link href={href} />}
                  >
                    <ProjectIcon icon={pro.icon} color={pro.color} size="sm" />
                    <span className="truncate">{pro.name}</span>
                  </SidebarMenuButton>
                  {hasTracks && (
                    <CollapsibleTrigger
                      render={
                        <SidebarMenuAction className="[&>svg]:size-1.5! group/menu-action [&>svg]:text-muted-foreground" />
                      }
                    >
                      <RiTriangleFill className="rotate-90 group-data-panel-open/menu-action:rotate-180" />
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {tracks.map((track) => {
                        const trackHref = `${href}/track/${track._id}`
                        const isTrackActive = pathname.startsWith(trackHref)

                        return (
                          <SidebarMenuSubItem key={track._id}>
                            <SidebarMenuSubButton
                              isActive={isTrackActive}
                              render={<Link href={trackHref} />}
                            >
                              <RiRouteLine className="size-3.5 opacity-70" />
                              <span className="truncate">{track.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarGroup>
  )
}
