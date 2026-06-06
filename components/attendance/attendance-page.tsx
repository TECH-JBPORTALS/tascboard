'use client'

import { useQuery } from 'convex/react'
import { useMemo } from 'react'
import { AttendanceShell } from '@/components/attendance/attendance-shell'
import { DailyTab } from '@/components/attendance/daily-tab'
import { LeaveTab } from '@/components/attendance/leave-tab'
import { MonthlyTab } from '@/components/attendance/monthly-tab'
import { useAttendanceState } from '@/components/attendance/use-attendance-state'
import { api } from '@/convex/_generated/api'
import {
  type EmployeeRef,
  type EnrichedLeave,
  getEndOfDay,
  getEndOfMonth,
  getStartOfDay,
  getStartOfMonth,
  type LeaveRequest,
} from '@/lib/attendance-types'

export function AttendancePage() {
  const {
    activeTab,
    setActiveTab,
    date,
    prevDay,
    nextDay,
    year,
    month,
    prevMonth,
    nextMonth,
  } = useAttendanceState()

  const employees = useQuery(api.employees.list, {})
  const leaveRequests = useQuery(api.leaveRequest.list, {})
  const dailyRecords = useQuery(api.attendance.listTodayAttendance, {
    startOfDay: getStartOfDay(date),
    endOfDay: getEndOfDay(date),
  })
  const monthlyRecords = useQuery(api.attendance.listTodayAttendance, {
    startOfDay: getStartOfMonth(year, month),
    endOfDay: getEndOfMonth(year, month),
  })

  const empList = useMemo<EmployeeRef[]>(
    () =>
      (employees ?? []).map((e) => ({
        id: e.id,
        name: e.user?.name ?? e.user?.email ?? 'Unknown',
        email: e.user?.email ?? '',
        image: e.user?.image ?? null,
        role: e.role,
      })),
    [employees],
  )

  const rawLeaves = useMemo<LeaveRequest[]>(
    () => leaveRequests ?? [],
    [leaveRequests],
  )

  const enrichedLeave = useMemo<EnrichedLeave[]>(
    () =>
      rawLeaves.map((r) => ({
        ...r,
        employee: empList.find((e) => e.id === r.employeeId),
      })),
    [rawLeaves, empList],
  )

  return (
    <AttendanceShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'daily' && (
        <DailyTab
          date={date}
          onPrev={prevDay}
          onNext={nextDay}
          records={dailyRecords}
          employees={employees === undefined ? undefined : empList}
        />
      )}
      {activeTab === 'monthly' && (
        <MonthlyTab
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          records={monthlyRecords}
          employees={employees === undefined ? undefined : empList}
        />
      )}
      {activeTab === 'leave' && (
        <LeaveTab
          records={leaveRequests === undefined ? undefined : enrichedLeave}
          employees={empList}
          leaveRequests={rawLeaves}
        />
      )}
    </AttendanceShell>
  )
}
