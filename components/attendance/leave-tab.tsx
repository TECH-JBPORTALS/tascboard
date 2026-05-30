'use client'

import { RiAddLargeFill, RiFilePdfLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  EmployeeRef,
  EnrichedLeave,
  LeaveRequest,
} from '@/lib/attendance-types'
import { AttendanceSearchBar } from './attendance-search-bar'
import { LeaveBalanceSection } from './leave-balance-section'
import { LeaveTable } from './leave-table'
import { RaiseLeaveDialog } from './raise-leave-dialog'

type Props = {
  records: EnrichedLeave[] | undefined
  employees: EmployeeRef[]
  leaveRequests: LeaveRequest[]
}

export function LeaveTab({ records, employees, leaveRequests }: Props) {
  const [raiseOpen, setRaiseOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = (records ?? []).filter((r) =>
    (r.employee?.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Leave Requests</p>
          <AttendanceSearchBar
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
          />
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
      {records === undefined ? (
        <div className="space-y-3 p-4 md:p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <LeaveTable records={filtered} />
          <LeaveBalanceSection
            employees={employees}
            leaveRequests={leaveRequests}
          />
        </>
      )}
      <RaiseLeaveDialog
        employees={employees}
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
      />
    </div>
  )
}
