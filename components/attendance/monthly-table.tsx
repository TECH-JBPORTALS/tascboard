'use client'

import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type AttendanceRecord,
  type EmployeeRef,
  getElapsedWorkingDays,
} from '@/lib/attendance-types'

type Props = {
  records: AttendanceRecord[]
  employees: EmployeeRef[]
  year: number
  month: number
}

export function MonthlyTable({ records, employees, year, month }: Props) {
  const elapsed = getElapsedWorkingDays(year, month)

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">No data for this month.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Employee</TableHead>
          <TableHead>Attendance %</TableHead>
          <TableHead>Leave Days</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp) => {
          const empRecords = records.filter((r) => r.employeeId === emp.id)
          const present = empRecords.filter(
            (r) => r.status === 'present' || r.status === 'late',
          ).length
          const leaveDays = empRecords.filter(
            (r) => r.status === 'on leave' || r.status === 'half day',
          ).length
          const pct = elapsed > 0 ? Math.round((present / elapsed) * 100) : 0

          return (
            <TableRow key={emp.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-2.5 py-1">
                  <UserAvatar name={emp.name} imageUrl={emp.image} />
                  <div>
                    <p className="text-sm font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.role}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={pct >= 80 ? 'default' : 'secondary'}>
                  {pct}%
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{leaveDays}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
