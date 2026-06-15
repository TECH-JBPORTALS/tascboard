'use client'

import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AttendanceStatusBadge } from '@/components/common/attendance-status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import { applyTimeToDate, formatTimeInputValue } from '@/lib/attendance-time'
import { startOfCalendarDay } from '@/lib/calendar-date'
import type { SelectedAttendanceDay } from './types'

type AttendanceDaySheetProps = {
  selection: SelectedAttendanceDay | null
  onOpenChange: (open: boolean) => void
}

export function AttendanceDaySheet({
  selection,
  onOpenChange,
}: AttendanceDaySheetProps) {
  const open = selection !== null
  const recordDate = selection ? startOfCalendarDay(selection.day) : 0

  const dayDetailQuery = useQuery(
    api.attendance.getEmployeeDayDetail,
    selection
      ? {
          employeeId: selection.employeeId,
          recordDate,
        }
      : 'skip',
  )

  const dayDetail = dayDetailQuery ?? selection?.dayAttendance ?? null

  const dailyReport = useQuery(
    api.dailyReport.getByEmployeeAndDate,
    selection
      ? {
          employeeId: selection.employeeId,
          recordDate,
        }
      : 'skip',
  )

  const updateDay = useMutation(api.attendance.ownerUpdateEmployeeDay)

  const [loginTime, setLoginTime] = useState('')
  const [logoutTime, setLogoutTime] = useState('')
  const [absentRemarks, setAbsentRemarks] = useState('')
  const [savingTimes, setSavingTimes] = useState(false)
  const [markingAbsent, setMarkingAbsent] = useState(false)

  useEffect(() => {
    if (!dayDetail || !selection) return

    setLoginTime(
      dayDetail.loginTime ? formatTimeInputValue(dayDetail.loginTime) : '',
    )
    setLogoutTime(
      dayDetail.logoutTime ? formatTimeInputValue(dayDetail.logoutTime) : '',
    )
    setAbsentRemarks(dayDetail.remarks ?? '')
  }, [dayDetail, selection])

  const isReadOnly =
    dayDetail?.status === 'absent' || dayDetail?.status === 'on leave'
  const canEditTimes = dayDetail != null && !isReadOnly
  const isNewRecord = dayDetail != null && dayDetail.status == null
  const showMarkAbsent = dayDetail != null && !isReadOnly

  async function handleSaveTimes() {
    if (!selection || !canEditTimes || !loginTime) return

    setSavingTimes(true)
    try {
      await updateDay({
        employeeId: selection.employeeId,
        recordDate,
        loginTime: applyTimeToDate(recordDate, loginTime),
        logoutTime: logoutTime ? applyTimeToDate(recordDate, logoutTime) : null,
      })
      toast.success(
        isNewRecord ? 'Attendance record created' : 'Attendance times updated',
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update attendance',
      )
    } finally {
      setSavingTimes(false)
    }
  }

  async function handleMarkAbsent() {
    if (!selection) return

    setMarkingAbsent(true)
    try {
      await updateDay({
        employeeId: selection.employeeId,
        recordDate,
        markAbsent: true,
        remarks: absentRemarks,
      })
      toast.success('Marked as absent')
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to mark absent',
      )
    } finally {
      setMarkingAbsent(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{selection?.employeeName ?? 'Attendance'}</SheetTitle>
          <SheetDescription>
            {selection ? format(selection.day, 'EEEE, dd MMMM yyyy') : ''}
          </SheetDescription>
        </SheetHeader>

        {selection && dayDetailQuery === undefined && !selection.dayAttendance && (
          <div className="space-y-4 px-6 pb-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {dayDetail && selection && (
          <div className="space-y-6 px-6 pb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status</span>
              {dayDetail.status ? (
                <AttendanceStatusBadge
                  status={dayDetail.status}
                  loginTime={dayDetail.loginTime}
                  logoutTime={dayDetail.logoutTime}
                  isOnLeave={dayDetail.status === 'on leave'}
                  workingSchedule={dayDetail.workingSchedule}
                />
              ) : (
                <span className="text-sm">No record</span>
              )}
            </div>

            {dayDetail.status === 'absent' && dayDetail.remarks && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">Remarks</p>
                <p className="mt-1 text-sm">{dayDetail.remarks}</p>
              </div>
            )}

            {canEditTimes && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-time">Login time</Label>
                  <Input
                    id="login-time"
                    type="time"
                    value={loginTime}
                    onChange={(e) => setLoginTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logout-time">Logout time</Label>
                  <Input
                    id="logout-time"
                    type="time"
                    value={logoutTime}
                    onChange={(e) => setLogoutTime(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => void handleSaveTimes()}
                  disabled={savingTimes || !loginTime}
                >
                  {savingTimes
                    ? 'Saving...'
                    : isNewRecord
                      ? 'Save attendance'
                      : 'Save times'}
                </Button>
              </div>
            )}

            {showMarkAbsent && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">Mark as absent</h3>
                    <p className="text-xs text-muted-foreground">
                      Use when the employee did not follow attendance rules.
                    </p>
                  </div>
                  <Textarea
                    placeholder="Reason or remarks..."
                    value={absentRemarks}
                    onChange={(e) => setAbsentRemarks(e.target.value)}
                    rows={3}
                  />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => void handleMarkAbsent()}
                    disabled={markingAbsent || !absentRemarks.trim()}
                  >
                    {markingAbsent ? 'Saving...' : 'Mark absent'}
                  </Button>
                </div>
              </>
            )}

            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Daily report</h3>
              {dailyReport === undefined ? (
                <Skeleton className="h-24 w-full" />
              ) : dailyReport === null ? (
                <p className="text-sm text-muted-foreground">
                  No daily report submitted
                </p>
              ) : (
                <div className="space-y-3 rounded-md border p-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Login</p>
                      <p className="font-medium">{dailyReport.loginTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Logout</p>
                      <p className="font-medium">{dailyReport.logoutTime}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Work summary
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {dailyReport.workSummary}
                    </p>
                  </div>
                  {dailyReport.remark && (
                    <div>
                      <p className="text-sm text-muted-foreground">Remark</p>
                      <p className="mt-1 text-sm">{dailyReport.remark}</p>
                    </div>
                  )}
                  {dailyReport.tasks.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Completed tasks
                      </p>
                      <ul className="mt-2 space-y-1">
                        {dailyReport.tasks.map((task) => (
                          <li
                            key={task._id}
                            className="rounded-md bg-muted/50 px-2 py-1.5 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {task.taskCode}
                            </span>{' '}
                            {task.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <SheetFooter />
      </SheetContent>
    </Sheet>
  )
}
