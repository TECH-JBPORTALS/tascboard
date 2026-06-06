'use client'

import * as React from 'react'
import { RiTimeLine } from '@remixicon/react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

// Generate slots every 15 minutes in 12hr format
type Slot = { label: string; hour: number; minute: number }

function generateSlots(): Slot[] {
  const slots: Slot[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const period = h < 12 ? 'am' : 'pm'
      const displayHour = h % 12 === 0 ? 12 : h % 12
      const label = `${displayHour}:${String(m).padStart(2, '0')}${period}`
      slots.push({ label, hour: h, minute: m })
    }
  }
  return slots
}

const SLOTS = generateSlots()

function to12hr(hour: number, minute: number): string {
  const period = hour < 12 ? 'am' : 'pm'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:${String(minute).padStart(2, '0')}${period}`
}

function parse12hr(val: string): { hour: number; minute: number } | null {
  // supports: 9:00am, 9:00 am, 9am, 14:30, 2:30pm
  const clean = val.trim().toLowerCase().replace(/\s/g, '')
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/)
  if (!match) return null
  let h = parseInt(match[1], 10)
  const m = match[2] ? parseInt(match[2], 10) : 0
  const period = match[3]
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return null
  if (period === 'am') {
    if (h === 12) h = 0
  } else if (period === 'pm') {
    if (h !== 12) h += 12
  }
  if (h > 23) return null
  return { hour: h, minute: m }
}

interface TimePickerInputProps {
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
  placeholder?: string
}

export function TimePickerInput({
  hour,
  minute,
  onChange,
  placeholder,
}: TimePickerInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputVal, setInputVal] = React.useState(to12hr(hour, minute))
  const [inputError, setInputError] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)

  // sync input when external value changes
  React.useEffect(() => {
    setInputVal(to12hr(hour, minute))
  }, [hour, minute])

  // scroll selected slot into view when dropdown opens
  React.useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const el = listRef.current?.querySelector('[data-selected=true]') as HTMLElement
      el?.scrollIntoView({ block: 'center', behavior: 'instant' })
    }, 10)
    return () => clearTimeout(timer)
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value)
    setInputError(false)
  }

  const handleInputBlur = () => {
    const parsed = parse12hr(inputVal)
    if (parsed) {
      onChange(parsed.hour, parsed.minute)
      setInputVal(to12hr(parsed.hour, parsed.minute))
      setInputError(false)
    } else if (inputVal.trim() !== '') {
      setInputError(true)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parse12hr(inputVal)
      if (parsed) {
        onChange(parsed.hour, parsed.minute)
        setInputVal(to12hr(parsed.hour, parsed.minute))
        setInputError(false)
        setOpen(false)
      } else {
        setInputError(true)
      }
    }
    if (e.key === 'Escape') setOpen(false)
  }

  const handleSlotSelect = (slot: Slot) => {
    onChange(slot.hour, slot.minute)
    setInputVal(slot.label)
    setInputError(false)
    setOpen(false)
  }

  const currentLabel = to12hr(hour, minute)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type='button'
            variant='outline'
            className='w-full justify-start gap-2 font-normal text-sm'
          >
            <RiTimeLine className='size-3.5 shrink-0 text-muted-foreground' />
            <span>{currentLabel}</span>
          </Button>
        }
      />
      <PopoverContent
        className='w-44 p-0'
        align='start'
        sideOffset={4}
      >
        {/* Typeable input at top */}
        <div className='border-b border-border p-2'>
          <Input
            value={inputVal}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder ?? 'e.g. 9:00am'}
            className={cn(
              'h-7 text-sm',
              inputError && 'border-destructive focus-visible:ring-destructive',
            )}
            autoFocus
          />
          {inputError && (
            <p className='mt-1 text-[11px] text-destructive'>
              Invalid time. Try "9:00am" or "14:30"
            </p>
          )}
        </div>

        {/* 15-min interval slot list */}
        <div
          ref={listRef}
          className='h-52 overflow-y-auto'
          style={{ scrollbarWidth: 'none' }}
        >
          {SLOTS.map((slot) => {
            const isSelected = slot.hour === hour && slot.minute === minute
            return (
              <button
                key={slot.label}
                type='button'
                data-selected={isSelected}
                onClick={() => handleSlotSelect(slot)}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-sm transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {slot.label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Legacy TimePicker kept for backward compat (used by meeting-time-inputs)
interface LegacyProps {
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
}

export function TimePicker({ hour, minute, onChange }: LegacyProps) {
  return (
    <TimePickerInput hour={hour} minute={minute} onChange={onChange} />
  )
}