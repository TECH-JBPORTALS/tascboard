'use client'
import { RiCalendar2Line, RiSearch2Line } from '@remixicon/react'
import { ColumnDef } from '@tanstack/react-table'
import { useQuery } from 'convex-helpers/react/cache'
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from 'date-fns'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'
import { DataTable } from '../data-table'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

type AttendanceEmployee =
  (typeof api.attendance.listForEmployeesInDateRange._returnType)[number]

const workingDays = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

const getColumns = (weekDays: Date[]): ColumnDef<AttendanceEmployee>[] => {
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
        return (
          <div className="px-6 flex items-center gap-2 h-20 border-r">
            <Avatar>
              <AvatarImage />
              <AvatarFallback>
                {props.row.original.employee.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>{props.row.original.employee.user.name}</div>
          </div>
        )
      },
    },
    ...weekDays.map(
      (day): ColumnDef<AttendanceEmployee> => ({
        accessorKey: day.getTime().toString(),
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
          const attendance = row.original.attendance.find(
            (attendance: { date: number }) => attendance.date === day.getTime(),
          )

          const isWorkingDay = workingDays.includes(
            format(day, 'EEEE').toLowerCase(),
          )

          return (
            <div
              className={cn(
                'h-20 p-4 border-r w-full',
                isToday(day) && 'bg-accent/50',
                !isWorkingDay && 'pattern',
              )}
            >
              <span className="text-xs text-muted-foreground">
                {format(day, 'dd')}
              </span>
              {attendance?.status}
            </div>
          )
        },
      }),
    ),
  ]
}

export function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const start = addDays(startOfWeek(selectedDate), 1)
  const end = addDays(endOfWeek(selectedDate), 1)
  const data = useQuery(api.attendance.listForEmployeesInDateRange, {
    start: start.getTime(),
    end: end.getTime(),
  })

  const weekDays = eachDayOfInterval({
    start,
    end,
  })

  if (data === undefined) return null

  return (
    <div className=" space-y-4 px-6 py-4 [&_td]:p-0 [&_th]:px-0">
      <div className="flex justify-between items-center gap-6">
        <InputGroup className="max-w-sm h-8">
          <InputGroupAddon>
            <RiSearch2Line />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search" />
        </InputGroup>
        <Popover>
          <PopoverTrigger
            render={
              <Button size={'lg'} variant={'outline'}>
                <RiCalendar2Line className="text-muted-foreground" />
                {format(selectedDate, 'dd MMMM yyyy')}
              </Button>
            }
          />
          <PopoverContent className={'p-0 w-fit'}>
            <Calendar
              required
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
            />
          </PopoverContent>
        </Popover>
      </div>
      <DataTable columns={getColumns(weekDays)} data={data} />
    </div>
  )
}
