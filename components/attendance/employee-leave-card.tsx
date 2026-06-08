'use client'

import { RiDeleteBinLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { EnrichedLeave } from '@/lib/attendance-types'

type Props = { record: EnrichedLeave }

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'outline',
}

const TYPE_COLOR: Record<string, string> = {
  sick: 'text-blue-500',
  casual: 'text-violet-500',
  emergency: 'text-destructive',
}

function fmt(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function EmployeeLeaveCard({ record }: Props) {
  const remove = useMutation(api.leaveRequest.remove)
  const days = Math.ceil((record.endDate - record.startDate) / 86_400_000) + 1

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p
          className={`text-sm font-semibold capitalize ${TYPE_COLOR[record.leaveType] ?? ''}`}
        >
          {record.leaveType} Leave
        </p>
        <Badge
          variant={STATUS_VARIANT[record.status] ?? 'secondary'}
          className="capitalize"
        >
          {record.status}
        </Badge>
      </div>
      <Separator />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          {days} {days === 1 ? 'Day' : 'Days'}
        </p>
        <p className="text-xs text-muted-foreground">
          {fmt(record.startDate)} → {fmt(record.endDate)}
        </p>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {record.reason}
      </p>
      {record.status === 'pending' && (
        <>
          <Separator />
          <Button
            size="sm"
            variant="outline"
            className="w-full text-destructive"
            onClick={() => void remove({ leaveRequestId: record._id })}
          >
            <RiDeleteBinLine className="size-3.5" />
            Cancel Request
          </Button>
        </>
      )}
    </div>
  )
}
