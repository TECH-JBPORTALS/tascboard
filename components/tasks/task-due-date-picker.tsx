'use client'

import { useMutation } from 'convex/react'
import { startOfDay } from 'date-fns'
import * as React from 'react'
import { TaskDueDatePickerCommand } from '@/components/tasks/command/task-due-date-picker.command'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

type TaskDueDatePickerBaseProps = {
  dueDate?: number | null
  trigger: React.ReactElement
  className?: string
  align?: 'start' | 'center' | 'end'
  /** When set, overrides the distinct-due check (e.g. create-task form). */
  hasDueDate?: boolean
}

type TaskDueDatePickerProps = TaskDueDatePickerBaseProps &
  (
    | {
        taskId: Id<'tasks'>
        onSelect?: (date: Date) => void
        onClear?: () => void
      }
    | {
        taskId?: undefined
        onSelect: (date: Date) => void
        onClear?: () => void
      }
  )

export function TaskDueDatePicker({
  dueDate,
  trigger,
  className,
  align = 'end',
  hasDueDate: hasDueDateProp,
  ...mode
}: TaskDueDatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [showCalendar, setShowCalendar] = React.useState(false)
  const [calendarDate, setCalendarDate] = React.useState<Date>(() =>
    dueDate != null ? new Date(dueDate) : new Date(),
  )
  const updateTaskMutation = useMutation(api.task.update)

  const hasDueDate = hasDueDateProp ?? dueDate != null

  const applyDate = async (date: Date) => {
    if (mode.onSelect) {
      mode.onSelect(date)
    } else if (mode.taskId) {
      await updateTaskMutation({
        taskId: mode.taskId,
        body: { dueDate: startOfDay(date).getTime() },
      })
    }
    setOpen(false)
    setShowCalendar(false)
  }

  const clearDueDate = async () => {
    if (mode.onClear) {
      mode.onClear()
    } else if (mode.taskId) {
      await updateTaskMutation({
        taskId: mode.taskId,
        body: { dueDate: null },
      })
    }
    setOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      setCalendarDate(dueDate != null ? new Date(dueDate) : new Date())
      setShowCalendar(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className={cn('w-64 p-0', className)}
        align={align}
        sideOffset={4}
      >
        {showCalendar ? (
          <Calendar
            className="w-full"
            mode="single"
            selected={calendarDate}
            onSelect={(date) => {
              if (!date) return
              setCalendarDate(date)
              void applyDate(date)
            }}
          />
        ) : (
          <TaskDueDatePickerCommand
            dueDate={dueDate}
            hasDueDate={hasDueDate}
            onSelectDate={(date) => void applyDate(date)}
            onClear={() => void clearDueDate()}
            onCustom={() => setShowCalendar(true)}
          />
        )}
        {showCalendar ? (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowCalendar(false)}
            >
              Back
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
