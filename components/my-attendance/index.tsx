'use client'

import { RiTimeLine } from '@remixicon/react'
import { useMutation } from 'convex/react'
import { ConvexError } from 'convex/values'
import { useQuery } from 'convex-helpers/react/cache'
import { format, startOfDay } from 'date-fns'
import { isEmpty } from 'lodash'
import { parseAsIsoDate, useQueryState } from 'nuqs'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import { AttendanceStatusBadge } from '../common/attendance-status-badge'
import { AttendanceTimeTicker } from '../common/attendance-time-ticker'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Separator } from '../ui/separator'
import { DailyReportDialog } from './daily-report-dialog'
import {
  MyAttendanceSkeleton,
  TodayAttendanceSkeleton,
} from './my-attendance-skeleton'

/** My Attendance for Employee */
export function MyAttendance() {
  const [date, setDate] = useQueryState(
    'date',
    parseAsIsoDate
      .withOptions({ clearOnDefault: true })
      .withDefault(new Date()),
  )

  const myAttendance = useQuery(api.attendance.listMonthlyMineByMonth, {
    date: startOfDay(date).getTime(),
  })

  if (myAttendance === undefined) return <MyAttendanceSkeleton />
  if (isEmpty(myAttendance)) return <div>No attendance found</div>

  return (
    <div className="px-6 py-4 space-y-4">
      <Popover>
        <PopoverTrigger
          render={
            <Button variant={'outline'}>{format(date, 'MMMM yyyy')}</Button>
          }
        />
        <PopoverContent className={'w-fit p-0'}>
          <Calendar
            mode="single"
            defaultMonth={date}
            selected={date}
            onSelect={(date) => date && setDate(() => date)}
          />
        </PopoverContent>
      </Popover>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {myAttendance.map((att) => (
          <Card key={att._id} className="w-full">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-mono">
                <span>
                  <RiTimeLine className="size-5 text-muted-foreground" />
                </span>
                {format(new Date(att.recordDate), 'dd MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <AttendanceStatusBadge
                  status={att.status}
                  loginTime={att.loginTime}
                  logoutTime={att.logoutTime}
                  isOnLeave={att.status === 'on leave'}
                  workingSchedule={att.workingSchedule}
                />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Login Time</span>
                <span className="text-base font-semibold">
                  {format(new Date(att.loginTime), 'hh:mm aaa')}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground">Logout Time</span>
                <span className="text-base font-semibold">
                  {att.logoutTime
                    ? format(new Date(att.logoutTime), 'hh:mm aaa')
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
            <CardFooter className="space-x-2.5">
              <span className="text-muted-foreground">Remarks:</span>
              <span className="text-xs font-semibold">
                {att.remarks || 'N/A'}
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function TodayAttendance() {
  const todayAttendance = useQuery(api.attendance.getMyAttendanceByDate, {
    recordDate: startOfDay(Date.now()).getTime(),
  })
  const markLogin = useMutation(api.attendance.markLogin)
  const [loggingIn, setLoggingIn] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)

  async function onLogin() {
    setLoggingIn(true)
    try {
      await markLogin({})
    } catch (e) {
      if (e instanceof ConvexError) {
        toast.error(e.message)
      } else {
        toast.error('Failed to login')
      }
    }
    setLoggingIn(false)
  }

  async function onLogout() {
    setReportDialogOpen(true)
  }

  if (todayAttendance === undefined) return <TodayAttendanceSkeleton />

  if (isEmpty(todayAttendance))
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hey, Good morning! 🌞</CardTitle>
          <CardDescription>
            Let's start your day with a smile! Get login to the work
          </CardDescription>
        </CardHeader>

        <CardFooter>
          <Button onClick={() => onLogin()} disabled={loggingIn}>
            {loggingIn ? 'Logging in...' : 'Login to work'}
          </Button>
        </CardFooter>
      </Card>
    )

  if (!todayAttendance.logoutTime)
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RiTimeLine className="text-muted-foreground size-5" />
              Today Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-5 items-center">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Login Time</span>
              <span className="text-base font-semibold">
                {format(new Date(todayAttendance.loginTime), 'hh:mm aaa')}
              </span>
            </div>
            <Separator orientation="vertical" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Working Clock </span>
              <span className="text-base font-semibold text-primary">
                <AttendanceTimeTicker
                  loginTime={todayAttendance.loginTime}
                  showSeconds
                />
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant={'outline'} onClick={() => onLogout()}>
              Logout from work
            </Button>
          </CardFooter>
        </Card>
        <DailyReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          attendanceId={todayAttendance._id}
          loginTime={todayAttendance.loginTime}
        />
      </>
    )
}
