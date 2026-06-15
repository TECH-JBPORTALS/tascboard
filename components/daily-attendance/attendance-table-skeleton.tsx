'use client'

import { format, isSameDay } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

const SKELETON_ROW_COUNT = 10

type AttendanceTableSkeletonProps = {
  weekDays: Date[]
}

export function AttendanceTableSkeleton({
  weekDays,
}: AttendanceTableSkeletonProps) {
  const isToday = (date: Date) => isSameDay(date, new Date())

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex h-full w-full items-center justify-center bg-accent/50 px-6 py-3">
                Employee
              </div>
            </TableHead>
            {weekDays.map((day) => (
              <TableHead key={day.toISOString()}>
                <div
                  className={cn(
                    'flex h-full w-full items-center justify-center bg-accent/50 px-6 py-3',
                    isToday(day) && 'border-x bg-accent',
                  )}
                >
                  {format(day, 'EEEE')}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell className="group/table-cell">
                <div className="flex h-20 items-center gap-2 border-r px-6">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </TableCell>
              {weekDays.map((day) => (
                <TableCell key={day.toISOString()} className="group/table-cell">
                  <div
                    className={cn(
                      'relative flex h-20 items-center justify-center border-r p-4 group-last/table-cell:border-r-0',
                      isToday(day) && 'bg-accent/50',
                    )}
                  >
                    <span className="absolute top-2.5 left-4 text-xs text-muted-foreground">
                      {format(day, 'dd')}
                    </span>
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
