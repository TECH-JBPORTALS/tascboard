'use client'

import { RiArrowLeftFill, RiUserSettingsLine } from '@remixicon/react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'
import { ProjectsSettingsGroup } from './projects-settings-group'

const settingsNavItems = [
  {
    label: 'General',
    href: '/settings',
    icon: RiUserSettingsLine,
  },
] as const

export function SettingsSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { orgSlug } = useParams<{ orgSlug: string }>()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => router.replace(`/${orgSlug}`)}
              size="sm"
              className="w-fit rounded-full font-medium"
            >
              <RiArrowLeftFill />
              Back to app
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => {
                const href = `/${orgSlug}${item.href}`
                const isActive = pathname === href

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={href} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <ProjectsSettingsGroup />
      </SidebarContent>
    </Sidebar>
  )
}
