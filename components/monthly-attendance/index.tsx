'use client'

import { useQuery } from 'convex-helpers/react/cache'
import { startOfMonth } from 'date-fns'
import { useQueryState } from 'nuqs'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { api } from '@/convex/_generated/api'
import {
  attendanceSearchParser,
  filterAttendanceByEmployeeName,
} from '@/lib/attendance-search'
import { startOfCalendarDay } from '@/lib/calendar-date'
import { DataTable } from '../data-table'
import { MonthlyAttendanceTableSkeleton } from './attendance-table-skeleton'
import { monthlyAttendanceColumns } from './columns'

function parseSelectedDate(dateParam: string | null): Date {
  if (!dateParam) return startOfMonth(new Date())
  const parsed = new Date(dateParam)
  return Number.isNaN(parsed.getTime())
    ? startOfMonth(new Date())
    : startOfMonth(parsed)
}

export function MonthlyAttendance() {
  const searchParams = useSearchParams()
  const selectedDate = parseSelectedDate(searchParams.get('date'))
  const [search] = useQueryState('q', attendanceSearchParser)

  const data = useQuery(api.attendance.listMonthlySummaryForEmployees, {
    month: startOfCalendarDay(startOfMonth(selectedDate)),
    now: startOfCalendarDay(new Date()),
  })

  const filteredData = useMemo(
    () => (data ? filterAttendanceByEmployeeName(data, search) : []),
    [data, search],
  )

  if (data === undefined) return <MonthlyAttendanceTableSkeleton />

  return <DataTable columns={monthlyAttendanceColumns} data={filteredData} />
}
