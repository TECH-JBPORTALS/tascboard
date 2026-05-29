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
import { cn } from '@/lib/utils'

type SprintDatePickerProps = {
  date?: Date
  onSelect: (date: Date) => void
  disabledDates?: (date: Date) => boolean
  disabled?: boolean
  variant?: 'inline' | 'field'
  label?: string
  id?: string
  placeholder?: string
}

export function SprintDatePicker({
  date,
  onSelect,
  disabledDates,
  disabled,
  variant = 'inline',
  label,
  id,
  placeholder = 'Select date',
}: SprintDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const trigger =
    variant === 'field' ? (
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={cn(
          'w-full justify-start gap-2 font-normal',
          !date && 'text-muted-foreground',
        )}
      >
        <RiCalendarLine className="size-4 shrink-0" />
        {date ? format(date, 'MMM d, yyyy') : placeholder}
      </Button>
    ) : (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        className="h-7 gap-1.5 px-2"
      >
        <RiCalendarLine className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground group-hover/button:text-foreground">
          {date ? format(date, 'MMM d, yyyy') : placeholder}
        </span>
      </Button>
    )

  return (
    <div className={variant === 'field' ? 'grid gap-2' : undefined}>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger id={id} disabled={disabled} render={trigger} />
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          <Calendar
            mode="single"
            selected={date}
            disabled={disabledDates}
            onSelect={(nextDate) => {
              if (!nextDate) return
              onSelect(nextDate)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
