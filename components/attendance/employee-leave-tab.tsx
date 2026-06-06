'use client'

import { RiAddLine } from '@remixicon/react'
import { useState } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { ColumnDef } from '@tanstack/react-table'
import type { EnrichedLeave, LeaveStatus } from '@/lib/attendance-types'
import { EmployeeRaiseLeaveDialog } from './employee-raise-leave-dialog'

type Props = {
  records: EnrichedLeave[] | undefined
  employeeId: string
}

const FILTERS: { label: string; value: LeaveStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

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
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const employeeLeaveColumns: ColumnDef<EnrichedLeave, unknown>[] = [
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
      const days = Math.ceil((row.original.endDate - row.original.startDate) / 86_400_000) + 1
      return <span className='text-sm'>{days} {days === 1 ? 'day' : 'days'}</span>
    },
  },
  {
    id: 'dates',
    header: 'Dates',
    cell: ({ row }) => (
      <span className='text-xs text-muted-foreground'>
        {fmt(row.original.startDate)} → {fmt(row.original.endDate)}
      </span>
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
      <Badge variant={STATUS_VARIANT[row.original.status] ?? 'secondary'} className='capitalize'>
        {row.original.status}
      </Badge>
    ),
  },
]

export function EmployeeLeaveTab({ records, employeeId }: Props) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<LeaveStatus | 'all'>('all')

  const filtered = (records ?? []).filter(
    (r) => filter === 'all' || r.status === filter,
  )

  return (
    <div className='flex flex-col'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6'>
        <div className='flex items-center gap-1 rounded-lg border p-0.5'>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type='button'
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              <span className='ml-1.5 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]'>
                {f.value === 'all'
                  ? (records ?? []).length
                  : (records ?? []).filter((r) => r.status === f.value).length}
              </span>
            </button>
          ))}
        </div>
        <Button size='sm' onClick={() => setOpen(true)}>
          <RiAddLine className='size-4' />
          Raise Leave
        </Button>
      </div>

      {/* Content */}
      {records === undefined ? (
        <div className='space-y-2 p-4 md:p-6'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      ) : (
        <div className='p-4 md:p-6'>
          <DataTable columns={employeeLeaveColumns} data={filtered} />
        </div>
      )}

      <EmployeeRaiseLeaveDialog
        open={open}
        onOpenChange={setOpen}
        employeeId={employeeId}
      />
    </div>
  )
}