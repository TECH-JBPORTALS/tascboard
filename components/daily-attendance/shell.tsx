'use client'

import { RiCalendar2Line, RiSearch2Line } from '@remixicon/react'
import { format } from 'date-fns'
import { parseAsIsoDate, useQueryState } from 'nuqs'
import React from 'react'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

export function DailyAttendanceShell({
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
  return (
    <div className="space-y-4 px-6 py-4 [&_td]:p-0 [&_th]:px-0">
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
              onSelect={(date) => date && setSelectedDate(date)}
            />
          </PopoverContent>
        </Popover>
      </div>
      {children}
    </div>
  )
}
