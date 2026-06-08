'use client'

import { RiCheckLine, RiCloseLine, RiDeleteBinLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import { useActor } from '@/hooks/use-actor'
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

export function LeaveCard({ record }: Props) {
  const { deviceName } = useActor()
  const update = useMutation(api.leaveRequest.update)
  const remove = useMutation(api.leaveRequest.remove)
  const days = Math.ceil((record.endDate - record.startDate) / 86_400_000) + 1

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2.5">
        <UserAvatar
          name={record.employee?.name ?? '?'}
          imageUrl={record.employee?.image}
          className="size-7"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {record.employee?.name ?? 'Unknown'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {record.employee?.role ?? ''}
          </p>
        </div>
        <Badge
          variant={STATUS_VARIANT[record.status] ?? 'secondary'}
          className="capitalize shrink-0"
        >
          {record.status}
        </Badge>
      </div>
      <Separator />
      <div className="flex flex-col gap-1">
        <p
          className={`text-sm font-semibold capitalize ${TYPE_COLOR[record.leaveType] ?? ''}`}
        >
          {days} {days === 1 ? 'Day' : 'Days'} — {record.leaveType} leave
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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() =>
                void update({
                  leaveRequestId: record._id,
                  body: { status: 'approved', approvedBy: deviceName },
                })
              }
            >
              <RiCheckLine className="size-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() =>
                void update({
                  leaveRequestId: record._id,
                  body: { status: 'rejected', approvedBy: deviceName },
                })
              }
            >
              <RiCloseLine className="size-3.5" />
              Reject
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8 shrink-0 text-destructive"
              onClick={() => void remove({ leaveRequestId: record._id })}
            >
              <RiDeleteBinLine className="size-3.5" />
            </Button>
          </div>
        </>
      )}
      {record.status !== 'pending' && (
        <Button
          size="sm"
          variant="ghost"
          className="w-fit text-destructive self-end"
          onClick={() => void remove({ leaveRequestId: record._id })}
        >
          <RiDeleteBinLine className="size-3.5" />
          Delete
        </Button>
      )}
    </div>
  )
}
