'use client'

import { Button } from '@/components/ui/button'
import { RECURRENCE_DAYS, type RecurrenceDay } from '@/lib/meeting-types'

interface MeetingRecurrencePickerProps {
  selected: RecurrenceDay[]
  onChange: (days: RecurrenceDay[]) => void
}

export function MeetingRecurrencePicker({
  selected,
  onChange,
}: MeetingRecurrencePickerProps) {
  const toggle = (day: RecurrenceDay) => {
    onChange(
      selected.includes(day)
        ? selected.filter((d) => d !== day)
        : [...selected, day],
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {RECURRENCE_DAYS.map((day) => (
        <Button
          key={day}
          size="sm"
          variant={selected.includes(day) ? 'default' : 'outline'}
          onClick={() => toggle(day)}
          type="button"
        >
          {day.slice(0, 3).toUpperCase()}
        </Button>
      ))}
    </div>
  )
}