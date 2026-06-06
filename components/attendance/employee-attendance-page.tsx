'use client'

import { useQuery } from 'convex/react'
import { useMemo } from 'react'
import { AttendanceShell } from '@/components/attendance/attendance-shell'
import { useAttendanceState } from '@/components/attendance/use-attendance-state'
import { api } from '@/convex/_generated/api'
import {
  type EnrichedLeave,
  type LeaveRequest,
  getEndOfDay,
  getEndOfMonth,
  getStartOfDay,
  getStartOfMonth,
} from '@/lib/attendance-types'
import { EmployeeDailyTab } from './employee-daily-tab'
import { EmployeeLeaveTab } from './employee-leave-tab'
import { EmployeeMonthlyTab } from './employee-monthly-tab'

export function EmployeeAttendancePage() {
  const profile = useQuery(api.employeeProfiles.getMyProfile)
  const { activeTab, setActiveTab, date, prevDay, nextDay, year, month, prevMonth, nextMonth } =
    useAttendanceState()

  const employeeId = profile?.employeeId ?? ''

  const dailyRecords = useQuery(
    api.attendance.listTodayAttendance,
    employeeId
      ? { startOfDay: getStartOfDay(date), endOfDay: getEndOfDay(date) }
      : 'skip',
  )
  const monthlyRecords = useQuery(
    api.attendance.listTodayAttendance,
    employeeId
      ? { startOfDay: getStartOfMonth(year, month), endOfDay: getEndOfMonth(year, month) }
      : 'skip',
  )
  const leaveRequests = useQuery(api.leaveRequest.list, employeeId ? {} : 'skip')

  const myDaily = useMemo(
    () => (dailyRecords ?? []).filter((r) => r.employeeId === employeeId),
    [dailyRecords, employeeId],
  )
  const myMonthly = useMemo(
    () => (monthlyRecords ?? []).filter((r) => r.employeeId === employeeId),
    [monthlyRecords, employeeId],
  )
  const myLeaves = useMemo<LeaveRequest[]>(
    () => (leaveRequests ?? []).filter((r) => r.employeeId === employeeId),
    [leaveRequests, employeeId],
  )
  const enrichedLeaves = useMemo<EnrichedLeave[]>(
    () => myLeaves.map((r) => ({ ...r, employee: undefined })),
    [myLeaves],
  )

  return (
    <AttendanceShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'daily' && (
        <EmployeeDailyTab
          date={date}
          onPrev={prevDay}
          onNext={nextDay}
          records={dailyRecords === undefined ? undefined : myDaily}
        />
      )}
      {activeTab === 'monthly' && (
        <EmployeeMonthlyTab
          year={year}
          month={month}
          onPrev={prevMonth}
          onNext={nextMonth}
          records={monthlyRecords === undefined ? undefined : myMonthly}
        />
      )}
      {activeTab === 'leave' && (
        <EmployeeLeaveTab
          records={leaveRequests === undefined ? undefined : enrichedLeaves}
          employeeId={employeeId}
        />
      )}
    </AttendanceShell>
  )
}