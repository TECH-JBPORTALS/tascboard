'use client'

import { RiAddLargeFill, RiFilePdfLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  EmployeeRef,
  EnrichedLeave,
  LeaveRequest,
  LeaveStatus,
} from '@/lib/attendance-types'
import { LeaveTable } from './leave-table'
import { RaiseLeaveDialog } from './raise-leave-dialog'

type Props = {
  records: EnrichedLeave[] | undefined
  employees: EmployeeRef[]
  leaveRequests: LeaveRequest[]
}

const FILTERS: { label: string; value: LeaveStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export function LeaveTab({ records, employees, leaveRequests }: Props) {
  const [raiseOpen, setRaiseOpen] = useState(false)
  const [filter, setFilter] = useState<LeaveStatus | 'all'>('all')

  const filtered = (records ?? []).filter(
    (r) => filter === 'all' || r.status === filter,
  )

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
                {f.value === 'all'
                  ? (records ?? []).length
                  : (records ?? []).filter((r) => r.status === f.value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <RiFilePdfLine className="size-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setRaiseOpen(true)}>
            <RiAddLargeFill className="size-4" />
            Raise Leave
          </Button>
        </div>
      </div>

      {/* Content */}
      {records === undefined ? (
        <div className="space-y-2 p-4 md:p-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <LeaveTable records={filtered} />
      )}

      <RaiseLeaveDialog
        employees={employees}
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
      />
    </div>
  )
}
