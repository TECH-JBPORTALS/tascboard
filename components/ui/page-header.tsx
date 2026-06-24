'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type PageHeaderProps = {
  /** Shown inside the rounded muted icon container (e.g. an icon). */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  icon,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-(--header-height) flex shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 backdrop-blur supports-backdrop-filter:bg-sidebar/80',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {icon != null ? (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
            {icon}
          </div>
        ) : null}
        <div className="flex min-w-0 flex-col justify-center gap-0.5 overflow-hidden">
          <div className="truncate font-heading text-sm font-semibold leading-5 tracking-tight [&_a]:truncate">
            {title}
          </div>
          {description != null ? (
            <div className="truncate text-xs leading-4 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>
      {actions != null ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
