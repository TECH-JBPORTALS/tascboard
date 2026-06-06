'use client'

import { RiCalendarLine } from '@remixicon/react'
import { format } from 'date-fns'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { TimePickerInput } from './time-picker'

type PickerProps = {
  timestamp: number
  onChange: (ts: number) => void
  label: string
}

function MeetingTimePicker({ timestamp, onChange, label }: PickerProps) {
  const date = new Date(timestamp)

  const handleTimeChange = (h: number, m: number) => {
    const updated = new Date(timestamp)
    updated.setHours(h, m, 0, 0)
    onChange(updated.getTime())
  }

  return (
    <div className='grid gap-2'>
      <Label className='text-xs text-muted-foreground'>{label}</Label>
      <TimePickerInput
        hour={date.getHours()}
        minute={date.getMinutes()}
        onChange={handleTimeChange}
      />
    </div>
  )
}

interface MeetingTimeInputsProps {
  startTime: number
  endTime: number
  onStartChange: (ts: number) => void
  onEndChange: (ts: number) => void
  timeOnly?: boolean
}

export function MeetingTimeInputs({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  timeOnly = false,
}: MeetingTimeInputsProps) {
  if (timeOnly) {
    return (
      <div className='grid grid-cols-2 gap-3'>
        <MeetingTimePicker
          timestamp={startTime}
          onChange={onStartChange}
          label='Start Time'
        />
        <MeetingTimePicker
          timestamp={endTime}
          onChange={onEndChange}
          label='End Time'
        />
      </div>
    )
  }

  return (
    <FullDateTimePicker
      startTime={startTime}
      endTime={endTime}
      onStartChange={onStartChange}
      onEndChange={onEndChange}
    />
  )
}

function FullDateTimePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
}: Omit<MeetingTimeInputsProps, 'timeOnly'>) {
  return (
    <div className='grid grid-cols-2 gap-3'>
      <FullPicker timestamp={startTime} onChange={onStartChange} label='Start' />
      <FullPicker timestamp={endTime} onChange={onEndChange} label='End' />
    </div>
  )
}

function FullPicker({
  timestamp,
  onChange,
  label,
}: {
  timestamp: number
  onChange: (ts: number) => void
  label: string
}) {
  const [dateOpen, setDateOpen] = React.useState(false)
  const date = new Date(timestamp)

  const handleDateSelect = (next: Date | undefined) => {
    if (!next) return
    const updated = new Date(next)
    updated.setHours(date.getHours(), date.getMinutes(), 0, 0)
    onChange(updated.getTime())
    setDateOpen(false)
  }

  const handleTimeChange = (h: number, m: number) => {
    const updated = new Date(timestamp)
    updated.setHours(h, m, 0, 0)
    onChange(updated.getTime())
  }

  return (
    <div className='grid gap-2'>
      <Label className='text-xs text-muted-foreground'>{label}</Label>
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger
          render={
            <Button
              type='button'
              variant='outline'
              className='w-full justify-start gap-2 font-normal text-xs'
            >
              <RiCalendarLine className='size-3.5 shrink-0' />
              {format(date, 'MMM d, yyyy')}
            </Button>
          }
        />
        <PopoverContent className='w-auto p-0' align='start' sideOffset={4}>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>
      <TimePickerInput
        hour={date.getHours()}
        minute={date.getMinutes()}
        onChange={handleTimeChange}
      />
    </div>
  )
}