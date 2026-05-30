'use client'

import { useMutation } from 'convex/react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { api } from '@/convex/_generated/api'
import {
 
  type AttendanceRecord,
  type AttendanceStatus,
  type EmployeeRef,
  type EnrichedAttendance,
  formatTime,
  getTotalHours,
  STATUS_LABELS,
} from '@/lib/attendance-types'
import { DailyRowActions } from './daily-row-actions'

type Props = {
  employee: EmployeeRef
  onEdit: (record: EnrichedAttendance) => void
  record: AttendanceRecord | undefined
  recordDate: number
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  present: 'default',
  late: 'destructive',
  'on leave': 'outline',
  'half day': 'secondary',
}

const HALF_DAY_MS = 4 * 60 * 60 * 1000
const OVERTIME_MS = 9 * 60 * 60 * 1000

export function DailyTableRow({ employee, onEdit, record, recordDate }: Props) {
  const create = useMutation(api.attendance.createAttendance)
  const update = useMutation(api.attendance.updateAttendance)

  const mark = (status: AttendanceStatus) =>
    create({ employeeId: employee.id, loginTime: Date.now(), recordDate, status })

  const checkOut = async () => {
    if (!record) return
    const now = Date.now()
    const elapsed = now - record.loginTime
    await update({
      attendanceId: record._id,
      body: {
        logoutTime: now,
        status: elapsed < HALF_DAY_MS ? 'half day' : record.status,
      },
    })
  }

  const isOvertime =
    record?.logoutTime
      ? record.logoutTime - record.loginTime > OVERTIME_MS
      : false

  const enriched: EnrichedAttendance | undefined = record
    ? { ...record, employee }
    : undefined

  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="flex items-center gap-2.5 py-1">
          <UserAvatar name={employee.name} imageUrl={employee.image} />
          <div>
            <p className="text-sm font-medium">{employee.name}</p>
            <p className="text-xs text-muted-foreground">{employee.role}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {record ? (
          <Badge variant={STATUS_VARIANT[record.status] ?? 'secondary'}>
            {STATUS_LABELS[record.status]}
          </Badge>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => void mark('present')}>
              Present
            </Button>
            <Button size="sm" variant="outline" onClick={() => void mark('on leave')}>
              On Leave
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm">
        {record ? formatTime(record.loginTime) : '—'}
      </TableCell>
      <TableCell className="text-sm">
        {record?.logoutTime ? formatTime(record.logoutTime) : '—'}
      </TableCell>
      <TableCell className="text-sm">
        {record?.logoutTime ? (
          <span className="flex items-center gap-1.5">
            {getTotalHours(record.loginTime, record.logoutTime)}
            {isOvertime ? <Badge variant="secondary">OT</Badge> : null}
          </span>
        ) : record ? (
          <Button size="sm" variant="outline" onClick={() => void checkOut()}>
            Check Out
          </Button>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>
        {enriched ? (
          <DailyRowActions record={enriched} onEdit={onEdit} />
        ) : null}
      </TableCell>
    </TableRow>
  )
}