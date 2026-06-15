'use client'

import type { ColumnDef } from '@tanstack/react-table'
import { api } from '@/convex/_generated/api'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Progress } from '../ui/progress'

export type MonthlyAttendanceRow =
  (typeof api.attendance.listMonthlySummaryForEmployees._returnType)[number]

function formatAttendedCount(count: number): string {
  return Number.isInteger(count) ? String(count) : count.toFixed(1)
}

function formatPercentage(percentage: number): string {
  return `${Math.round(percentage * 10) / 10}%`
}

export const monthlyAttendanceColumns: ColumnDef<MonthlyAttendanceRow>[] = [
  {
    header: 'Employee',
    accessorKey: 'employee',
    cell: ({ row }) => {
      const user = row.original.employee.user
      return (
        <div className="flex items-center gap-3 py-1">
          <Avatar>
            <AvatarImage src={user.image ?? ''} alt={`${user.name}'s avatar`} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      )
    },
  },
  {
    header: 'Attendance',
    accessorKey: 'attendedCount',
    cell: ({ row }) => {
      const { attendedCount, totalSessions } = row.original
      return (
        <span className="font-mono tabular-nums">
          {formatAttendedCount(attendedCount)} / {totalSessions}
        </span>
      )
    },
  },
  {
    header: 'Percentage',
    accessorKey: 'percentage',
    cell: ({ row }) => {
      const { percentage } = row.original
      return (
        <div className="flex min-w-[140px] items-center gap-3">
          <Progress value={percentage} className="h-2 flex-1" />
          <span className="w-14 text-right font-mono text-sm tabular-nums">
            {formatPercentage(percentage)}
          </span>
        </div>
      )
    },
  },
]
