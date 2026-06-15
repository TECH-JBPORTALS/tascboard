'use client'

import { useQuery } from 'convex-helpers/react/cache'
import { addDays, eachDayOfInterval, endOfWeek, startOfWeek } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { DataTable } from '../data-table'
import { AttendanceDaySheet } from './attendance-day-sheet'
import { AttendanceTableSkeleton } from './attendance-table-skeleton'
import { getColumns } from './columns'
import type { SelectedAttendanceDay } from './types'

function parseSelectedDate(dateParam: string | null): Date {
  if (!dateParam) return new Date()
  const parsed = new Date(dateParam)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function Attendance() {
  const searchParams = useSearchParams()
  const selectedDate = parseSelectedDate(searchParams.get('date'))

  const [selection, setSelection] = useState<SelectedAttendanceDay | null>(null)
  const start = addDays(startOfWeek(selectedDate), 1)
  const end = addDays(endOfWeek(selectedDate), 1)
  const weekDays = eachDayOfInterval({ start, end })

  const data = useQuery(api.attendance.listForEmployeesInDateRange, {
    start: start.getTime(),
    end: end.getTime(),
  })
  const workingSchedule = useQuery(
    api.organizationSettings.getWorkingSchedule,
    {},
  )

  const isLoading = data === undefined || workingSchedule === undefined

  if (isLoading) return <AttendanceTableSkeleton weekDays={weekDays} />

  return (
    <>
      <DataTable
        columns={getColumns(weekDays, workingSchedule, setSelection)}
        data={data}
      />

      <AttendanceDaySheet
        selection={selection}
        onOpenChange={(open) => {
          if (!open) setSelection(null)
        }}
      />
    </>
  )
}
