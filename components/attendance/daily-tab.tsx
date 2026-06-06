'use client'

import { RiFilePdfLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type AttendanceRecord,
  type AttendanceStatus,
  type EmployeeRef,
  getStartOfDay,
} from '@/lib/attendance-types'
import { exportDailyPDF } from './attendance-pdf'
import { AttendanceSearchBar } from './attendance-search-bar'
import { DailyDateNav } from './daily-date-nav'
import { DailyTable } from './daily-table'

type Props = {
  date: Date
  onPrev: () => void
  onNext: () => void
  records: AttendanceRecord[] | undefined
  employees: EmployeeRef[] | undefined
}

export function DailyTab({ date, onPrev, onNext, records, employees }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all')

  const isLoading = records === undefined || employees === undefined

  const filteredEmployees = (employees ?? []).filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (statusFilter === 'all') return true
    const record = records?.find((r) => r.employeeId === emp.id)
    return record?.status === statusFilter
  })

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <DailyDateNav date={date} onPrev={onPrev} onNext={onNext} />
          <AttendanceSearchBar
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportDailyPDF(records ?? [], employees ?? [], date)}
        >
          <RiFilePdfLine className="size-4" />
          Export PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4 md:p-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DailyTable
          records={records}
          employees={filteredEmployees}
          recordDate={getStartOfDay(date)}
        />
      )}
    </div>
  )
}