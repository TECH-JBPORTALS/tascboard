'use client'

import { RiFilePdfLine } from '@remixicon/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AttendanceRecord, EmployeeRef } from '@/lib/attendance-types'
import { exportMonthlyPDF } from './attendance-pdf'
import { AttendanceSearchBar } from './attendance-search-bar'
import { MonthlyNav } from './monthly-nav'
import { MonthlyTable } from './monthly-table'

type Props = {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  records: AttendanceRecord[] | undefined
  employees: EmployeeRef[] | undefined
}

export function MonthlyTab({
  year,
  month,
  onPrev,
  onNext,
  records,
  employees,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('')

  const isLoading = records === undefined || employees === undefined

  const filteredEmployees = (employees ?? []).filter((emp) =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <MonthlyNav
            year={year}
            month={month}
            onPrev={onPrev}
            onNext={onNext}
          />
          <AttendanceSearchBar
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            exportMonthlyPDF(records ?? [], employees ?? [], year, month)
          }
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
        <MonthlyTable
          records={records}
          employees={filteredEmployees}
          year={year}
          month={month}
        />
      )}
    </div>
  )
}
