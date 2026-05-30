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
import type { EnrichedLeave } from '@/lib/attendance-types'
import { LeaveRowActions } from './leave-row-actions'

type Props = { records: EnrichedLeave[] }

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  approved: 'default',
  pending: 'secondary',
  rejected: 'outline',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function LeaveTable({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">
          No leave requests found.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => {
          const days = Math.ceil((r.endDate - r.startDate) / 86_400_000) + 1
          return (
            <TableRow key={r._id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    name={r.employee?.name ?? '?'}
                    imageUrl={r.employee?.image}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {r.employee?.name ?? 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.employee?.role ?? ''}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="capitalize text-sm">
                {r.leaveType}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(r.startDate)}
              </TableCell>
              <TableCell className="text-sm">{formatDate(r.endDate)}</TableCell>
              <TableCell className="text-sm">{days}</TableCell>
              <TableCell className="max-w-48 truncate text-sm">
                {r.reason}
              </TableCell>
              <TableCell>
                <Badge
                  variant={STATUS_VARIANT[r.status] ?? 'secondary'}
                  className="capitalize"
                >
                  {r.status}
                </Badge>
              </TableCell>
              <TableCell>
                <LeaveRowActions record={r} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
