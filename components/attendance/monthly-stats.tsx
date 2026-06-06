import {
  type AttendanceRecord,
  getElapsedWorkingDays,
} from '@/lib/attendance-types'

type Props = {
  records: AttendanceRecord[]
  year: number
  month: number
  totalEmployees: number
}

type StatCardProps = { label: string; value: number | string }

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  )
}

export function MonthlyStats({ records, year, month, totalEmployees }: Props) {
  const elapsed = getElapsedWorkingDays(year, month)
  const present = records.filter((r) => r.status === 'present').length
  const late = records.filter((r) => r.status === 'late').length
  const onLeave = records.filter((r) => r.status === 'on leave').length
  const halfDay = records.filter((r) => r.status === 'half day').length

  const uniquePresent = new Set(
    records
      .filter((r) => r.status === 'present' || r.status === 'late')
      .map((r) => r.employeeId),
  ).size
  const absent = Math.max(0, totalEmployees - uniquePresent)

  return (
    <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-6 md:p-6">
      <StatCard label="Working Days" value={elapsed} />
      <StatCard label="Present" value={present} />
      <StatCard label="Late" value={late} />
      <StatCard label="Half Day" value={halfDay} />
      <StatCard label="On Leave" value={onLeave} />
      <StatCard label="Absent Today" value={absent} />
    </div>
  )
}
