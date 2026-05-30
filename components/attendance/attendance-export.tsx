import {
  type AttendanceRecord,
  type EmployeeRef,
  type EnrichedAttendance,
  formatTime,
  getElapsedWorkingDays,
  getTotalHours,
  STATUS_LABELS,
} from '@/lib/attendance-types'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function downloadCsv(rows: (string | number)[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = filename
  a.click()
}

export function exportDailyCsv(records: EnrichedAttendance[], date: Date) {
  const label = date.toLocaleDateString('en-IN').replace(/\//g, '-')
  downloadCsv(
    [
      ['Employee','Role','Status','Check In','Check Out','Total Hours'],
      ...records.map((r) => [
        r.employee?.name ?? 'Unknown',
        r.employee?.role ?? '',
        STATUS_LABELS[r.status],
        formatTime(r.loginTime),
        r.logoutTime ? formatTime(r.logoutTime) : '',
        getTotalHours(r.loginTime, r.logoutTime),
      ]),
    ],
    `attendance-${label}.csv`,
  )
}

export function exportMonthlyCsv(
  employees: EmployeeRef[],
  records: AttendanceRecord[],
  year: number,
  month: number,
) {
  const elapsed = getElapsedWorkingDays(year, month)
  downloadCsv(
    [
      ['Employee','Role','Present','Late','Half Day','On Leave','Absent','Attendance %'],
      ...employees.map((emp) => {
        const er = records.filter((r) => r.employeeId === emp.id)
        const present = er.filter((r) => r.status === 'present').length
        const late = er.filter((r) => r.status === 'late').length
        const halfDay = er.filter((r) => r.status === 'half day').length
        const onLeave = er.filter((r) => r.status === 'on leave').length
        const absent = Math.max(0, elapsed - (present + late + halfDay + onLeave))
        const pct = elapsed > 0 ? Math.round(((present + late) / elapsed) * 100) : 0
        return [emp.name, emp.role, present, late, halfDay, onLeave, absent, `${pct}%`]
      }),
    ],
    `attendance-${MONTH_NAMES[month]}-${year}.csv`,
  )
}