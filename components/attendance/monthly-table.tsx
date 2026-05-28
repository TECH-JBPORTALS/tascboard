'use client'

import { UserAvatar } from '@/components/employees/UserAvatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MonthlyRecord, MonthlyStatus } from '@/lib/attendance-types'

const MONTHLY_STATUS_VARIANT: Record<
  MonthlyStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  'on track': 'default',
  warning: 'outline',
  critical: 'destructive',
}

interface MonthlyTableProps {
  records: MonthlyRecord[]
}

export function MonthlyTable({ records }: MonthlyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Attendance Rate</TableHead>
          <TableHead>Total Present</TableHead>
          <TableHead>Total Late</TableHead>
          <TableHead>Total Leaves</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <UserAvatar name={r.name} imageUrl={r.avatarUrl} />
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.role}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span
                className={
                  r.attendanceRate < 75
                    ? 'text-destructive font-medium text-sm'
                    : 'text-sm font-medium'
                }
              >
                {r.attendanceRate}%
              </span>
            </TableCell>
            <TableCell className="text-sm">{r.totalPresent}</TableCell>
            <TableCell className="text-sm">{r.totalLate}</TableCell>
            <TableCell className="text-sm">{r.totalLeaves}</TableCell>
            <TableCell>
              <Badge
                variant={MONTHLY_STATUS_VARIANT[r.monthlyStatus]}
                className="capitalize"
              >
                {r.monthlyStatus}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
