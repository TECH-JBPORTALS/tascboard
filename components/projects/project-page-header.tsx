'use client'

import { RiArrowRightSLine } from '@remixicon/react'
import Link from 'next/link'
import type * as React from 'react'
import { ProjectIcon } from '@/components/projects/project-icon'
import { cn } from '@/lib/utils'
import { PageHeader } from '../ui/page-header'

type ProjectPageHeaderProps = {
  orgSlug: string
  projectName: string
  icon?: string | null
  color?: string | null
  actions?: React.ReactNode
  className?: string
}

export function ProjectPageHeader({
  orgSlug,
  projectName,
  icon,
  color,
  actions,
  className,
}: ProjectPageHeaderProps) {
  return (
    <PageHeader
      className={cn(className)}
      actions={actions}
      title={
        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Projects
          </Link>
          <RiArrowRightSLine className="size-4 text-muted-foreground" />
          <ProjectIcon icon={icon} color={color} size="sm" />
          <span className="truncate font-medium text-sm">{projectName}</span>
        </div>
      }
    />
  )
}
