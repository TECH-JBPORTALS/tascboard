'use client'
import { RiCalendar2Line, RiSearch2Line } from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache'
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
} from 'date-fns'
import { useState } from 'react'
import { api } from '@/convex/_generated/api'
import { DataTable } from '../data-table'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { AttendanceDaySheet } from './attendance-day-sheet'
import { getColumns } from './columns'
import type { SelectedAttendanceDay } from './types'

export function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selection, setSelection] = useState<SelectedAttendanceDay | null>(null)
  const start = addDays(startOfWeek(selectedDate), 1)
  const end = addDays(endOfWeek(selectedDate), 1)
  const data = useQuery(api.attendance.listForEmployeesInDateRange, {
    start: start.getTime(),
    end: end.getTime(),
  })
  const workingSchedule = useQuery(
    api.organizationSettings.getWorkingSchedule,
    {},
  )
  if (workingSchedule === undefined) return null

  const weekDays = eachDayOfInterval({
    start,
    end,
  })

  if (data === undefined) return null

  return (
    <div className=" space-y-4 px-6 py-4 [&_td]:p-0 [&_th]:px-0 ">
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
      <DataTable
        columns={getColumns(weekDays, workingSchedule, setSelection)}
        data={data}
      />

      <AttendanceDaySheet
        selection={selection}
        onOpenChange={(open) => {
          if (!open) setSelection(null)
        }}
      />
    </div>
  )
}
