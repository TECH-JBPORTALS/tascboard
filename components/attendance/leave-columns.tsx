'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { useMutation } from 'convex/react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { useActor } from '@/hooks/use-actor'
import type { EnrichedLeave } from '@/lib/attendance-types'
import { RiCheckLine, RiCloseLine, RiDeleteBinLine } from '@remixicon/react'

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

function ActionsCell({ record }: { record: EnrichedLeave }) {
  const { deviceName } = useActor()
  const update = useMutation(api.leaveRequest.update)
  const remove = useMutation(api.leaveRequest.remove)

  if (record.status === 'pending') {
    return (
      <div className='flex items-center gap-1'>
        <Button
          size='sm'
          className='h-7 text-xs'
          onClick={() =>
            void update({
              leaveRequestId: record._id,
              body: { status: 'approved', approvedBy: deviceName },
            })
          }
        >
          <RiCheckLine className='size-3.5' />
          Approve
        </Button>
        <Button
          size='sm'
          variant='outline'
          className='h-7 text-xs'
          onClick={() =>
            void update({
              leaveRequestId: record._id,
              body: { status: 'rejected', approvedBy: deviceName },
            })
          }
        >
          <RiCloseLine className='size-3.5' />
          Reject
        </Button>
        <Button
          size='icon'
          variant='ghost'
          className='size-7 text-destructive'
          onClick={() => void remove({ leaveRequestId: record._id })}
        >
          <RiDeleteBinLine className='size-3.5' />
        </Button>
      </div>
    )
  }

  return (
    <Button
      size='icon'
      variant='ghost'
      className='size-7 text-destructive'
      onClick={() => void remove({ leaveRequestId: record._id })}
    >
      <RiDeleteBinLine className='size-3.5' />
    </Button>
  )
}

export const leaveColumns: ColumnDef<EnrichedLeave, unknown>[] = [
  {
    id: 'employee',
    header: 'Employee',
    cell: ({ row }) => {
      const e = row.original.employee
      return (
        <div className='flex items-center gap-2.5'>
          <UserAvatar
            name={e?.name ?? '?'}
            imageUrl={e?.image}
            className='size-7 shrink-0'
          />
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>{e?.name ?? 'Unknown'}</p>
            <p className='truncate text-xs text-muted-foreground'>{e?.role ?? ''}</p>
          </div>
        </div>
      )
    },
  },
  {
    id: 'type',
    header: 'Leave Type',
    cell: ({ row }) => (
      <span className={`text-sm font-medium capitalize ${TYPE_COLOR[row.original.leaveType] ?? ''}`}>
        {row.original.leaveType}
      </span>
    ),
  },
  {
    id: 'duration',
    header: 'Duration',
    cell: ({ row }) => {
      const days =
        Math.ceil(
          (row.original.endDate - row.original.startDate) / 86_400_000,
        ) + 1
      return (
        <span className='text-sm'>
          {days} {days === 1 ? 'day' : 'days'}
        </span>
      )
    },
  },
  {
    id: 'dates',
    header: 'Dates',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='text-xs text-muted-foreground'>
          {fmt(row.original.startDate)} → {fmt(row.original.endDate)}
        </span>
      </div>
    ),
  },
  {
    id: 'reason',
    header: 'Reason',
    cell: ({ row }) => (
      <p className='max-w-[200px] truncate text-xs text-muted-foreground'>
        {row.original.reason}
      </p>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge
        variant={STATUS_VARIANT[row.original.status] ?? 'secondary'}
        className='capitalize'
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ActionsCell record={row.original} />,
  },
]