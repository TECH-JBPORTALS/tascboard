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
import type { AttendanceStatus, DailyRecord } from '@/lib/attendance-types'

const STATUS_VARIANT: Record<
  AttendanceStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  present: 'default',
  'checked out': 'secondary',
  late: 'destructive',
  'on leave': 'outline',
  'half day': 'outline',
  absent: 'destructive',
}

interface DailyTableProps {
  records: DailyRecord[]
}

export function DailyTable({ records }: DailyTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Check In</TableHead>
          <TableHead>Check Out</TableHead>
          <TableHead>Total Hours</TableHead>
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
              <Badge variant={STATUS_VARIANT[r.status]} className="capitalize">
                {r.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {r.location ?? '—'}
            </TableCell>
            <TableCell className="text-sm">{r.loginTime ?? '—:—'}</TableCell>
            <TableCell className="text-sm">{r.logoutTime ?? '—:—'}</TableCell>
            <TableCell className="text-sm">{r.totalHours ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
