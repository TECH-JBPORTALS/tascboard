'use client'

import {
  RiAddCircleLine,
  RiCalendarLine,
  RiLinksLine,
  RiRepeatLine,
  RiTimeLine,
} from '@remixicon/react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getMeetingStatus, STATUS_CONFIG, RECURRENCE_LABELS, type RecurrenceDay, type RecurrenceType } from '@/lib/meeting-types'
import { TimePickerInput } from './time-picker'
import { MeetingRecurrenceDays } from './meeting-recurrence-days'

interface Props {
  startTime: number
  endTime: number
  meetingLink: string
  hasSchedule: boolean
  createdAt: number
  recurrenceType: string
  recurrenceDays?: RecurrenceDay[]
  onTrackAttendance: () => void
  onStartTimeChange?: (ts: number) => void
  onEndTimeChange?: (ts: number) => void
  onRecurrenceTypeChange?: (type: RecurrenceType) => void
  onRecurrenceDaysChange?: (days: RecurrenceDay[]) => void
}

export function MeetingDetailProperties({
  startTime,
  endTime,
  meetingLink,
  hasSchedule,
  createdAt,
  recurrenceType,
  recurrenceDays = [],
  onTrackAttendance,
  onStartTimeChange,
  onEndTimeChange,
  onRecurrenceTypeChange,
  onRecurrenceDaysChange,
}: Props) {
  const status = getMeetingStatus(startTime, endTime)
  const statusConfig = STATUS_CONFIG[status]

  const dotClass =
    status === 'live'
      ? 'bg-red-500 animate-pulse'
      : status === 'upcoming'
        ? 'bg-blue-400'
        : 'bg-muted-foreground/40'

  const textClass =
    status === 'live'
      ? 'text-red-500'
      : status === 'upcoming'
        ? 'text-blue-400'
        : 'text-muted-foreground'

  const recurrenceLabel =
    recurrenceType === 'none'
      ? 'No recurrence'
      : `${recurrenceType.charAt(0).toUpperCase()}${recurrenceType.slice(1)} recurrence`

  const handleStartChange = (h: number, m: number) => {
    if (!onStartTimeChange) return
    const updated = new Date(startTime)
    updated.setHours(h, m, 0, 0)
    onStartTimeChange(updated.getTime())
  }

  const handleEndChange = (h: number, m: number) => {
    if (!onEndTimeChange) return
    const updated = new Date(endTime)
    updated.setHours(h, m, 0, 0)
    onEndTimeChange(updated.getTime())
  }

  const handleRecurrenceChange = (val: string | null) => {
    if (!onRecurrenceTypeChange || !val) return
    const next = val as RecurrenceType
    onRecurrenceTypeChange(next)
    if (next !== 'weekly') onRecurrenceDaysChange?.([])
  }

  const toggleDay = (day: RecurrenceDay) => {
    if (!onRecurrenceDaysChange) return
    const next = recurrenceDays.includes(day)
      ? recurrenceDays.filter((d) => d !== day)
      : [...recurrenceDays, day]
    onRecurrenceDaysChange(next)
  }

  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  const canEdit = !!(onStartTimeChange && onEndTimeChange)
  const canEditRecurrence = !!onRecurrenceTypeChange

  return (
    <div className='flex flex-col gap-3 border-y border-border py-4'>

      {/* Row 1 — status, date, recurrence, created, link */}
      <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>

        {/* Status */}
        <div className='flex items-center gap-1.5'>
          <span className={`size-1.5 rounded-full ${dotClass}`} />
          <span className={`text-xs font-medium ${textClass}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Date */}
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <RiCalendarLine className='size-3.5' />
          <span>{format(startDate, 'MMM d, yyyy')}</span>
        </div>

        {/* Recurrence */}
        <div className='flex items-center gap-1.5'>
          <RiRepeatLine className='size-3.5 text-muted-foreground' />
          {canEditRecurrence ? (
            <Select
              value={recurrenceType}
              onValueChange={handleRecurrenceChange}
            >
              <SelectTrigger className='h-6 gap-1 border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus:ring-0 hover:text-foreground'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((k) => (
                  <SelectItem key={k} value={k} className='text-xs'>
                    {RECURRENCE_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className='text-xs text-muted-foreground'>{recurrenceLabel}</span>
          )}
        </div>

        {/* Created at */}
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <RiAddCircleLine className='size-3.5' />
          <span>Created {format(new Date(createdAt), 'MMM d, yyyy · hh:mm a')}</span>
        </div>

        {/* Meeting link */}
        {meetingLink ? (
          <a
            href={meetingLink}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-1.5 text-xs text-blue-400 hover:underline'
          >
            <RiLinksLine className='size-3.5' />
            <span>Join meeting</span>
          </a>
        ) : null}
      </div>

      {/* Weekly day picker */}
      {recurrenceType === 'weekly' && canEditRecurrence && (
        <MeetingRecurrenceDays
          selected={recurrenceDays}
          onToggle={toggleDay}
        />
      )}

      {/* Row 2 — time pickers + attendance button */}
      <div className='flex items-center gap-3'>
        <RiTimeLine className='size-3.5 shrink-0 text-muted-foreground' />

        {canEdit ? (
          <div className='flex items-center gap-2'>
            <div className='w-32'>
              <TimePickerInput
                hour={startDate.getHours()}
                minute={startDate.getMinutes()}
                onChange={handleStartChange}
              />
            </div>
            <span className='text-xs text-muted-foreground'>–</span>
            <div className='w-32'>
              <TimePickerInput
                hour={endDate.getHours()}
                minute={endDate.getMinutes()}
                onChange={handleEndChange}
              />
            </div>
          </div>
        ) : (
          <span className='text-xs text-muted-foreground'>
            {format(startDate, 'hh:mm a')} – {format(endDate, 'hh:mm a')}
          </span>
        )}

        {hasSchedule ? (
          <Button
            variant='outline'
            size='sm'
            className='ml-auto h-7 text-xs'
            onClick={onTrackAttendance}
          >
            Track attendance
          </Button>
        ) : null}
      </div>

    </div>
  )
}