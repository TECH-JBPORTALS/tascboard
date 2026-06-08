'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type DailyRow,
  formatTime,
  getTotalHours,
  STATUS_LABELS,
} from '@/lib/attendance-types'
import { buildActionsColumn } from './daily-columns-actions'

export const STATUS_VARIANT: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  present: 'default',
  late: 'destructive',
  'on leave': 'outline',
  'half day': 'secondary',
}

const OVERTIME_MS = 9 * 60 * 60 * 1000

export function buildDailyColumns(
  onEdit: (row: DailyRow) => void,
): ColumnDef<DailyRow, unknown>[] {
  return [
    {
      id: 'employee',
      header: 'Employee',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 py-1 pl-2">
          <UserAvatar
            name={row.original.employee.name}
            imageUrl={row.original.employee.image}
          />
          <div>
            <p className="text-sm font-medium">{row.original.employee.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.employee.role}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { employee, onCreate, record, recordDate } = row.original
        if (record) {
          return (
            <Badge variant={STATUS_VARIANT[record.status] ?? 'secondary'}>
              {STATUS_LABELS[record.status]}
            </Badge>
          )
        }
        return (
          <div className="flex items-center gap-2">
            {/* Present — solid primary (blue) */}
            <Button
              size="sm"
              onClick={() => void onCreate(employee.id, recordDate, 'present')}
            >
              Present
            </Button>
            {/* On Leave — orange outline */}
            <Button
              size="sm"
              variant="outline"
              className="border-orange-500/70 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500"
              onClick={() => void onCreate(employee.id, recordDate, 'on leave')}
            >
              On Leave
            </Button>
          </div>
        )
      },
    },
    {
      id: 'checkIn',
      header: 'Check In',
      cell: ({ row }) =>
        row.original.record ? formatTime(row.original.record.loginTime) : '—',
    },
    {
      id: 'checkOut',
      header: 'Check Out',
      cell: ({ row }) => {
        const { onCheckOut, record } = row.original
        if (!record) return '—'
        if (record.logoutTime) return formatTime(record.logoutTime)
        // No checkout button for on leave
        if (record.status === 'on leave') return '—'
        return (
          <Button size="sm" variant="outline" onClick={() => void onCheckOut()}>
            Check Out
          </Button>
        )
      },
    },
    {
      id: 'hours',
      header: 'Total Hours',
      cell: ({ row }) => {
        const { record } = row.original
        if (!record?.logoutTime) return '—'
        const isOT = record.logoutTime - record.loginTime > OVERTIME_MS
        return (
          <span className="flex items-center gap-1.5">
            {getTotalHours(record.loginTime, record.logoutTime)}
            {isOT ? <Badge variant="secondary">OT</Badge> : null}
          </span>
        )
      },
    },
    buildActionsColumn(onEdit),
  ]
}
