'use client'

import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache'
import { format, startOfDay } from 'date-fns'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Skeleton } from '../ui/skeleton'
import { Textarea } from '../ui/textarea'

type DailyReportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendanceId: Id<'attendance'>
  loginTime: number
  onSuccess?: () => void
}

export function DailyReportDialog({
  open,
  onOpenChange,
  attendanceId,
  loginTime,
  onSuccess,
}: DailyReportDialogProps) {
  const today = startOfDay(Date.now()).getTime()
  const doneTasks = useQuery(
    api.dailyReport.listMyDoneTasksForToday,
    open ? { today } : 'skip',
  )
  const submitAndLogout = useMutation(api.dailyReport.submitAndLogout)

  const [workSummary, setWorkSummary] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<Id<'tasks'>[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setWorkSummary('')
      setSelectedTaskIds([])
      setSubmitting(false)
    }
  }, [open])

  const toggleTask = (taskId: Id<'tasks'>) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    )
  }

  const handleSubmit = async () => {
    if (!workSummary.trim()) {
      toast.error('Please describe what you accomplished today')
      return
    }

    setSubmitting(true)
    try {
      await submitAndLogout({
        attendanceId,
        workSummary: workSummary.trim(),
        taskIds: selectedTaskIds,
        logoutTime: Date.now(),
      })
      toast.success('Daily report submitted. You are logged out.')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit daily report',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Daily report</DialogTitle>
          <DialogDescription>
            Summarize your work for today before logging out. Logged in at{' '}
            {format(new Date(loginTime), 'hh:mm aaa')}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work-summary">What did you accomplish?</Label>
            <Textarea
              id="work-summary"
              placeholder="Describe the work you completed today..."
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tasks completed today</Label>
            {doneTasks === undefined ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : doneTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No tasks marked done today. You can still submit your report.
              </p>
            ) : (
              <ScrollArea className="max-h-48 rounded-md border">
                <div className="divide-y">
                  {doneTasks.map((task) => {
                    const checked = selectedTaskIds.includes(task._id)
                    return (
                      <label
                        key={task._id}
                        className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleTask(task._id)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">
                            {task.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {task.taskCode}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit & logout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
