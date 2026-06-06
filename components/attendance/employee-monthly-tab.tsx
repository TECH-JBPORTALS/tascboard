'use client'

import { MonthlyNav } from '@/components/attendance/monthly-nav'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type AttendanceRecord,
  getElapsedWorkingDays,
} from '@/lib/attendance-types'

type Props = {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  records: AttendanceRecord[] | undefined
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function EmployeeMonthlyTab({
  year,
  month,
  onPrev,
  onNext,
  records,
}: Props) {
  const elapsed = getElapsedWorkingDays(year, month)

  const present = records?.filter((r) => r.status === 'present').length ?? 0
  const late = records?.filter((r) => r.status === 'late').length ?? 0
  const halfDay = records?.filter((r) => r.status === 'half day').length ?? 0
  const onLeave = records?.filter((r) => r.status === 'on leave').length ?? 0
  const marked = present + late + halfDay + onLeave
  const absent = Math.max(0, elapsed - marked)
  const pct = elapsed > 0 ? Math.round(((present + late) / elapsed) * 100) : 0

  const stats = [
    { label: 'Present', value: present, variant: 'default' as const },
    { label: 'Late', value: late, variant: 'secondary' as const },
    { label: 'Half Day', value: halfDay, variant: 'secondary' as const },
    { label: 'On Leave', value: onLeave, variant: 'outline' as const },
    { label: 'Absent', value: absent, variant: 'outline' as const },
  ]

  return (
    <div className="flex flex-col">
      <div className="flex items-center border-b px-4 py-3 md:px-6">
        <MonthlyNav year={year} month={month} onPrev={onPrev} onNext={onNext} />
      </div>
      <div className="flex flex-col gap-4 p-4 md:p-6">
        {records === undefined ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">
                {MONTH_NAMES[month]} {year}
              </p>
              <Badge variant={pct >= 80 ? 'default' : 'secondary'}>
                {pct}% Attendance
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {stats.map((s) => (
                <Card key={s.label}>
                  <CardContent className="flex flex-col gap-1 p-4">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
