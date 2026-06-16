'use client'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const SKELETON_ROW_COUNT = 6

export function LeaveTableSkeleton({
  showEmployeeColumn = false,
}: {
  showEmployeeColumn?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {showEmployeeColumn ? <TableHead>Employee</TableHead> : null}
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            {showEmployeeColumn ? <TableHead>Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {showEmployeeColumn ? (
                <TableCell>
                  <div className="flex items-center gap-3 py-1">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </TableCell>
              ) : null}
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              {showEmployeeColumn ? (
                <TableCell>
                  <Skeleton className="h-8 w-28" />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
