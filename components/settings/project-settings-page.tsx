'use client'

import { RiArrowRightSLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'
import {
  Field,
  FieldDescription,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { ProjectIcon } from '../projects/project-icon'
import { Card, CardContent } from '../ui/card'

const settingsSections = [
  {
    label: 'General',
    description: 'Icon, name, manager, and members.',
    href: 'general',
  },
  {
    label: 'Labels',
    description: 'Create and manage project labels.',
    href: 'labels',
  },
] as const

export function ProjectSettingsPage() {
  const { orgSlug, projectId } = useParams<{
    orgSlug: string
    projectId: Id<'projects'>
  }>()
  const project = useQuery(api.project.get, { projectId })

  if (project === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (project === null) {
    return (
      <div className="text-sm text-muted-foreground">Project not found</div>
    )
  }

  const subtitle =
    project.summary?.trim() ||
    "Manage this project's settings, members, and labels."

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between px-2.5">
        <div>
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <ProjectIcon
          className="size-12"
          icon={project.icon}
          color={project.color}
        />
      </div>

      <Card className="py-0 gap-0">
        {settingsSections.map((section, index) => {
          const href = `/${orgSlug}/settings/p/${projectId}/${section.href}`

          return (
            <React.Fragment key={section.href}>
              {index > 0 ? <Separator /> : null}
              <Link href={href} className="h-full">
                <CardContent className="hover:bg-accent/40 h-full py-4">
                  <Field orientation={'horizontal'}>
                    <FieldSet className="min-w-0 flex-1">
                      <FieldLegend>{section.label}</FieldLegend>
                      <FieldDescription>{section.description}</FieldDescription>
                    </FieldSet>
                    <RiArrowRightSLine className="size-5 shrink-0 text-muted-foreground" />
                  </Field>
                </CardContent>
              </Link>
            </React.Fragment>
          )
        })}
      </Card>
    </div>
  )
}
