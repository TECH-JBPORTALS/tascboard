'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format, isSameDay } from 'date-fns'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { AttendanceStatusBadge } from '../common/attendance-status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

type AttendanceEmployee =
  (typeof api.attendance.listForEmployeesInDateRange._returnType)[number]

type WorkSchedule =
  (typeof api.organizationSettings.getWorkingSchedule._returnType)

function isWorkingDay(day: Date, schedule: WorkSchedule): boolean {
  const weekday = format(day, 'EEEE').toLowerCase() as keyof WorkSchedule
  return schedule[weekday].enabled
}

export const getColumns = (
  weekDays: Date[],
  workingSchedule: WorkSchedule,
): ColumnDef<AttendanceEmployee>[] => {
  const isToday = (date: Date) => isSameDay(date, new Date())

  return [
    {
      header: () => (
        <div className="px-6 bg-accent/50 h-full flex items-center justify-center w-full">
          Employee
        </div>
      ),
      accessorKey: 'name',
      cell(props) {
        const user = props.row.original.employee.user
        return (
          <div className="px-6 flex items-center gap-2 h-20 border-r">
            <Avatar>
              <AvatarImage
                src={user.image ?? ''}
                alt={`${user.name}'s avatar`}
              />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>{user.name}</div>
          </div>
        )
      },
    },
    ...weekDays.map(
      (day): ColumnDef<AttendanceEmployee> => ({
        accessorKey: day.toISOString(),
        header: () => (
          <div
            className={cn(
              'px-6 bg-accent/50 h-full flex items-center justify-center w-full',
              isToday(day) && 'bg-accent border-x',
            )}
          >
            {format(day, 'EEEE')}
          </div>
        ),
        cell: ({ row }) => {
          const dayAttendance = row.original.attendance[day.toDateString()]
          const hasAttendance = dayAttendance?.status != null
          const showNonWorkingPattern =
            !isWorkingDay(day, workingSchedule) && !hasAttendance

          return (
            <div
              className={cn(
                'h-20 p-4 flex flex-col relative items-center justify-center border-r w-full group-last/table-cell:border-r-0',
                isToday(day) && 'bg-accent/50',
                showNonWorkingPattern && 'pattern',
              )}
            >
              <span className="text-xs absolute top-2.5 left-4 text-muted-foreground">
                {format(day, 'dd')}
              </span>
              {dayAttendance?.status && (
                <AttendanceStatusBadge
                  loginTime={dayAttendance.loginTime}
                  logoutTime={dayAttendance.logoutTime}
                  isOnLeave={dayAttendance.status === 'on leave'}
                />
              )}
            </div>
          )
        },
      }),
    ),
  ]
}
