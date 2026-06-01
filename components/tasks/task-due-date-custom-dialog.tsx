'use client'

import * as React from 'react'
import { useTaskActionsContext } from '@/components/tasks/task-actions-provider'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function TaskDueDateCustomDialog() {
  const { task, customDueDateOpen, setCustomDueDateOpen, setDueDate } =
    useTaskActionsContext()

  const [selectedDate, setSelectedDate] = React.useState<Date>(() =>
    task.dueDate != null ? new Date(task.dueDate) : new Date(),
  )

  React.useEffect(() => {
    if (customDueDateOpen) {
      setSelectedDate(
        task.dueDate != null ? new Date(task.dueDate) : new Date(),
      )
    }
  }, [customDueDateOpen, task.dueDate])

  return (
    <Dialog open={customDueDateOpen} onOpenChange={setCustomDueDateOpen}>
      <DialogContent className="w-fit p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Pick a due date</DialogTitle>
        </DialogHeader>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return
            setSelectedDate(date)
            setDueDate(date)
            setCustomDueDateOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
