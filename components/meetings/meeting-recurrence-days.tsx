'use client'

import { cn } from '@/lib/utils'
import { ALL_DAYS, RECURRENCE_DAY_LABELS, type RecurrenceDay } from '@/lib/meeting-types'

interface MeetingRecurrenceDaysProps {
  selected: RecurrenceDay[]
  onToggle: (day: RecurrenceDay) => void
}

export function MeetingRecurrenceDays({
  selected,
  onToggle,
}: MeetingRecurrenceDaysProps) {
  return (
    <div className='flex flex-wrap gap-1.5 pt-1'>
      {ALL_DAYS.map((day) => {
        const isSelected = selected.includes(day)
        return (
          <button
            key={day}
            type='button'
            onClick={() => onToggle(day)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:border-border/80 hover:bg-muted/40',
            )}
          >
            {RECURRENCE_DAY_LABELS[day]}
          </button>
        )
      })}
    </div>
  )
}