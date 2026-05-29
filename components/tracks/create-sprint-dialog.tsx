'use client'

import { useMutation } from 'convex/react'
import { startOfDay } from 'date-fns'
import * as React from 'react'
import { SprintDatePicker } from '@/components/tracks/sprint-date-picker'
import { SprintGoalInput } from '@/components/tracks/sprint-goal-input'
import {
  SprintStatusIcon,
  SprintStatusPicker,
} from '@/components/tracks/sprint-status-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import {
  type SprintStatus,
  SPRINT_GOAL_MAX_LENGTH,
  sprintStatusConfig,
} from '@/lib/track-utils'
import { cn } from '@/lib/utils'

type CreateSprintDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trackId: Id<'tracks'>
}

export function CreateSprintDialog({
  open,
  onOpenChange,
  trackId,
}: CreateSprintDialogProps) {
  const createSprint = useMutation(api.sprint.create)
  const [goal, setGoal] = React.useState('')
  const [status, setStatus] = React.useState<SprintStatus>('planned')
  const [startDate, setStartDate] = React.useState<Date | undefined>()
  const [endDate, setEndDate] = React.useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setGoal('')
      setStatus('planned')
      setStartDate(undefined)
      setEndDate(undefined)
      setError(null)
    }
  }, [open])

  function handleStartDateSelect(nextStart: Date) {
    const normalized = startOfDay(nextStart)
    setStartDate(normalized)
    if (endDate && startOfDay(endDate) <= normalized) {
      setEndDate(undefined)
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmedGoal = goal.trim()

    if (!trimmedGoal) {
      setError('Goal is required')
      return
    }
    if (trimmedGoal.length > SPRINT_GOAL_MAX_LENGTH) {
      setError(`Goal must be ${SPRINT_GOAL_MAX_LENGTH} characters or fewer`)
      return
    }
    if (!startDate) {
      setError('Start date is required')
      return
    }
    if (!endDate) {
      setError('End date is required')
      return
    }
    const start = startOfDay(startDate).getTime()
    const end = startOfDay(endDate).getTime()
    if (end <= start) {
      setError('End date must be after the start date')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createSprint({
        trackId,
        goal: trimmedGoal,
        startDate: start,
        endDate: end,
        status,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sprint')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goalRemaining = SPRINT_GOAL_MAX_LENGTH - goal.length
  const statusLabel = sprintStatusConfig[status].label

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create sprint</DialogTitle>
            <DialogDescription>
              Plan a time-boxed sprint with a goal and date range.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sprint-goal">Goal</Label>
                <span
                  className={cn(
                    'text-xs tabular-nums text-muted-foreground',
                    goalRemaining < 0 && 'text-destructive',
                  )}
                >
                  {goal.length}/{SPRINT_GOAL_MAX_LENGTH}
                </span>
              </div>
              <SprintGoalInput
                value={goal}
                onChange={setGoal}
                placeholder="What should this sprint achieve?"
              />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <SprintStatusPicker
                value={status}
                onSelect={setStatus}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 font-normal"
                  >
                    <SprintStatusIcon status={status} className="size-3.5" />
                    {statusLabel}
                  </Button>
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SprintDatePicker
                id="sprint-start-date"
                label="Start date"
                variant="field"
                date={startDate}
                placeholder="Select start date"
                onSelect={handleStartDateSelect}
              />
              <SprintDatePicker
                id="sprint-end-date"
                label="End date"
                variant="field"
                date={endDate}
                placeholder={
                  startDate ? 'Select end date' : 'Select start date first'
                }
                disabled={!startDate}
                onSelect={(nextEnd) => setEndDate(startOfDay(nextEnd))}
                disabledDates={(date) => {
                  if (!startDate) return true
                  return startOfDay(date) <= startOfDay(startDate)
                }}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create sprint'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
