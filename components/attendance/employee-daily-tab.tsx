'use client'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type AttendanceRecord,
  STATUS_LABELS,
  formatTime,
  getTotalHours,
} from '@/lib/attendance-types'
import { DailyDateNav } from '@/components/attendance/daily-date-nav'

type Props = {
  date: Date
  onPrev: () => void
  onNext: () => void
  records: AttendanceRecord[] | undefined
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  present: 'default',
  late: 'secondary',
  'on leave': 'outline',
  'half day': 'secondary',
}

export function EmployeeDailyTab({ date, onPrev, onNext, records }: Props) {
  const record = records?.[0]

  return (
    <div className='flex flex-col'>
      <div className='flex items-center border-b px-4 py-3 md:px-6'>
        <DailyDateNav date={date} onPrev={onPrev} onNext={onNext} />
      </div>
      <div className='p-4 md:p-6'>
        {records === undefined ? (
          <Skeleton className='h-32 w-full' />
        ) : !record ? (
          <div className='flex items-center justify-center py-16'>
            <p className='text-sm text-muted-foreground'>
              No attendance recorded for {format(date, 'PP')}.
            </p>
          </div>
        ) : (
          <Card className='max-w-md'>
            <CardContent className='flex flex-col gap-3 p-4'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium'>{format(date, 'PPPP')}</p>
                <Badge variant={STATUS_VARIANT[record.status] ?? 'secondary'}>
                  {STATUS_LABELS[record.status]}
                </Badge>
              </div>
              <div className='grid grid-cols-3 gap-3 text-sm'>
                <div className='flex flex-col gap-0.5'>
                  <p className='text-xs text-muted-foreground'>Check In</p>
                  <p className='font-medium'>{formatTime(record.loginTime)}</p>
                </div>
                <div className='flex flex-col gap-0.5'>
                  <p className='text-xs text-muted-foreground'>Check Out</p>
                  <p className='font-medium'>
                    {record.logoutTime ? formatTime(record.logoutTime) : '—'}
                  </p>
                </div>
                <div className='flex flex-col gap-0.5'>
                  <p className='text-xs text-muted-foreground'>Total Hours</p>
                  <p className='font-medium'>
                    {getTotalHours(record.loginTime, record.logoutTime)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}