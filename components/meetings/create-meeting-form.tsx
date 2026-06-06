'use client'

import { format } from 'date-fns'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  RECURRENCE_LABELS,
  type MeetingFormValues,
  type RecurrenceDay,
  type RecurrenceType,
} from '@/lib/meeting-types'
import { RiCalendarLine } from '@remixicon/react'
import { MeetingAttendeePicker } from './meeting-attendee-picker'
import { MeetingRecurrenceDays } from './meeting-recurrence-days'
import { MeetingTimeInputs } from './meeting-time-inputs'

type Props = {
  values: MeetingFormValues
  onChange: <K extends keyof MeetingFormValues>(
    key: K,
    value: MeetingFormValues[K],
  ) => void
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Label className='text-xs text-muted-foreground'>{label}</Label>
      {children}
    </div>
  )
}

export function CreateMeetingForm({ values, onChange }: Props) {
  const [dateOpen, setDateOpen] = React.useState(false)
  const isRecurring = values.recurrenceType !== 'none'

  const toggleAttendee = (id: string) => {
    const next = values.recipients.includes(id)
      ? values.recipients.filter((r) => r !== id)
      : [...values.recipients, id]
    onChange('recipients', next)
  }

  const toggleDay = (day: RecurrenceDay) => {
    const next = values.recurrenceDays.includes(day)
      ? values.recurrenceDays.filter((d) => d !== day)
      : [...values.recurrenceDays, day]
    onChange('recurrenceDays', next)
  }

  const handleRecurrenceChange = (v: string | null) => {
    const val = (v ?? 'none') as RecurrenceType
    onChange('recurrenceType', val)
    if (val !== 'weekly') onChange('recurrenceDays', [])
  }

  const handleDateSelect = (next: Date | undefined) => {
    if (!next) return
    const startDate = new Date(next)
    const existingStart = new Date(values.startTime)
    startDate.setHours(existingStart.getHours(), existingStart.getMinutes(), 0, 0)
    const diff = values.endTime - values.startTime
    onChange('startTime', startDate.getTime())
    onChange('endTime', startDate.getTime() + diff)
    setDateOpen(false)
  }

  return (
    <div className='grid grid-cols-2 gap-x-4 gap-y-4'>

      {/* Title — full width */}
      <Field label='Title' className='col-span-2'>
        <Input
          placeholder='Meeting title'
          value={values.title}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </Field>

      {/* Description — full width */}
      <Field label='Description' className='col-span-2'>
        <Textarea
          placeholder='What is this meeting about?'
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          className='min-h-[72px] resize-none'
        />
      </Field>

      {/* Attendees — full width */}
      <Field label='Attendees' className='col-span-2'>
        <MeetingAttendeePicker
          selected={values.recipients}
          onToggle={toggleAttendee}
        />
      </Field>

      {/* Recurrence — left col */}
      <Field label='Recurrence'>
        <Select
          value={values.recurrenceType}
          onValueChange={handleRecurrenceChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((k) => (
              <SelectItem key={k} value={k}>
                {RECURRENCE_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Date — right col (only if not recurring) */}
      {!isRecurring ? (
        <Field label='Date'>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger
              render={
                <Button
                  type='button'
                  variant='outline'
                  className='w-full justify-start gap-2 font-normal'
                >
                  <RiCalendarLine className='size-4 shrink-0' />
                  {format(new Date(values.startTime), 'MMM d, yyyy')}
                </Button>
              }
            />
            <PopoverContent className='w-auto p-0' align='start' sideOffset={4}>
              <Calendar
                mode='single'
                selected={new Date(values.startTime)}
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
        </Field>
      ) : (
        /* Recurrence days — right col when weekly */
        values.recurrenceType === 'weekly' && (
          <Field label='Days' className='col-span-2'>
            <MeetingRecurrenceDays
              selected={values.recurrenceDays}
              onToggle={toggleDay}
            />
          </Field>
        )
      )}

      {/* Time inputs — full width */}
      <Field label={isRecurring ? 'Time' : 'Start & End Time'} className='col-span-2'>
        <MeetingTimeInputs
          startTime={values.startTime}
          endTime={values.endTime}
          onStartChange={(ts) => onChange('startTime', ts)}
          onEndChange={(ts) => onChange('endTime', ts)}
          timeOnly={isRecurring}
        />
      </Field>

      {/* Meeting link — full width */}
      <Field label='Meeting Link' className='col-span-2'>
        <Input
          placeholder='https://meet.google.com/...'
          value={values.meetingLink}
          onChange={(e) => onChange('meetingLink', e.target.value)}
        />
      </Field>

    </div>
  )
}