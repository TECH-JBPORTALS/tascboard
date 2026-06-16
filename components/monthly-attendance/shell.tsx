'use client'

import { RiCalendar2Line, RiSearch2Line } from '@remixicon/react'
import { format, startOfMonth } from 'date-fns'
import { parseAsIsoDate, useQueryState } from 'nuqs'
import React from 'react'
import { attendanceSearchParser } from '@/lib/attendance-search'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

export function MonthlyAttendanceShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedDate, setSelectedDate] = useQueryState(
    'date',
    parseAsIsoDate
      .withDefault(new Date())
      .withOptions({ clearOnDefault: true }),
  )
  const [search, setSearch] = useQueryState('q', attendanceSearchParser)

  return (
    <div className="space-y-4 px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        <InputGroup className="h-8 max-w-sm">
          <InputGroupAddon>
            <RiSearch2Line />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <Popover>
          <PopoverTrigger
            render={
              <Button size="lg" variant="outline">
                <RiCalendar2Line className="text-muted-foreground" />
                {format(selectedDate, 'MMMM yyyy')}
              </Button>
            }
          />
          <PopoverContent className="w-fit p-0">
            <Calendar
              required
              mode="single"
              defaultMonth={selectedDate}
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(startOfMonth(date))}
            />
          </PopoverContent>
        </Popover>
      </div>
      {children}
    </div>
  )
}
