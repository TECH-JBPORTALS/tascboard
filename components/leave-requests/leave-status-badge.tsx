'use client'

import { Badge } from '@/components/ui/badge'
import type { LeaveStatus } from '@/lib/attendance-types'
import { cn } from '@/lib/utils'

const statusConfig: Record<LeaveStatus, { label: string; className: string }> =
  {
    pending: {
      label: 'Pending',
      className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    },
    approved: {
      label: 'Approved',
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-destructive/15 text-destructive',
    },
  }

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const config = statusConfig[status]
  return (
    <Badge className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
