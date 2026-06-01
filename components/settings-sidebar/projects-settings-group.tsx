'use client'

import { RiAddLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Protect } from '@/components/auth/protect'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectIcon } from '@/components/projects/project-icon'
import { api } from '@/convex/_generated/api'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar'

export function ProjectsSettingsGroup() {
  const pathname = usePathname()
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const basePath = `/${orgSlug}`
  const projects = useQuery(api.project.list)
  const [createOpen, setCreateOpen] = useState(false)

  const getProjectActiveState = useMemo(
    () => (href: string) =>
      pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  )

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarContent>
        <SidebarMenu>
          {projects?.map((project) => {
            const href = `${basePath}/settings/${project._id}`
            const isActive = getProjectActiveState(href)

            return (
              <SidebarMenuItem key={project._id}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={{ children: project.name }}
                  size="sm"
                  render={<Link href={href} />}
                >
                  <ProjectIcon
                    icon={project.icon}
                    color={project.color}
                    size="sm"
                  />
                  <span className="truncate">{project.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
          <Protect permissions={{ project: ['create'] }}>
            <SidebarMenuItem>
              <SidebarMenuButton size="sm" onClick={() => setCreateOpen(true)}>
                <RiAddLine /> Add new project
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Protect>
        </SidebarMenu>
      </SidebarContent>
      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarGroup>
  )
}
