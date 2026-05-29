'use client'

import {
  RiCalendarLine,
  RiCloseLine,
  RiContractLeftRightLine,
  RiExpandDiagonalLine,
} from '@remixicon/react'
import { JSONContent } from '@tiptap/react'
import { useMutation } from 'convex/react'
import { format, startOfDay } from 'date-fns'
import { motion } from 'motion/react'
import * as React from 'react'
import { TaskDueDatePicker } from '@/components/tasks/task-due-date-picker'
import {
  TaskPriorityIcon,
  TaskPriorityPicker,
} from '@/components/tasks/task-priority-picker'
import {
  TaskStatusIcon,
  TaskStatusPicker,
} from '@/components/tasks/task-status-picker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import {
  type TaskPriority,
  type TaskStatus,
  taskPriorityConfig,
  taskStatusConfig,
} from '@/lib/task-utils'
import { cn } from '@/lib/utils'
import { GlobalTiptapEditor } from '../editor/global-tiptap-editor'
import { TitleInput } from '../title-input'

type CreateTaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  track: Doc<'tracks'>
  projectId: Id<'projects'>
  sprintId?: Id<'sprints'>
  defaultStatus?: Doc<'tasks'>['status']
}

const COMPACT_WIDTH = 480
const EXPANDED_WIDTH = 640

function PropertyChip({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        'h-7 gap-1.5 rounded-md border-border/80 bg-muted/30 px-2.5 font-normal text-muted-foreground shadow-none hover:bg-muted/60 hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

const MotionGlobalTiptapEditor = motion.create(GlobalTiptapEditor)

export function CreateTaskDialog({
  open,
  onOpenChange,
  track,
  projectId,
  sprintId,
  defaultStatus = 'backlog',
}: CreateTaskDialogProps) {
  const createTask = useMutation(api.task.create)
  const addToSprint = useMutation(api.sprint.addTask)

  const [expanded, setExpanded] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState<string | JSONContent>()
  const [status, setStatus] = React.useState<TaskStatus>(defaultStatus)
  const [priority, setPriority] = React.useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = React.useState<Date>(() => new Date())
  const [dueDateSet, setDueDateSet] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const titleRef = React.useRef<HTMLTextAreaElement>(null)
  const startDate = startOfDay(new Date()).getTime()

  function resetForm() {
    setExpanded(false)
    setTitle('')
    setDescription('')
    setStatus(defaultStatus)
    setPriority('medium')
    setDueDate(new Date())
    setDueDateSet(false)
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm()
    onOpenChange(next)
  }

  React.useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => titleRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) {
      setError('Title is required')
      titleRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const end = dueDateSet ? startOfDay(dueDate).getTime() : startDate

      const taskId = await createTask({
        trackId: track._id,
        projectId,
        title: trimmed,
        description,
        status,
        priority,
        complexity: 'medium',
        dueDate: end,
      })

      if (sprintId) {
        await addToSprint({ taskId, sprintId })
      }

      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusLabel = taskStatusConfig[status].label
  const priorityLabel = taskPriorityConfig[priority].label

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid w-auto max-w-[calc(100%-2rem)] gap-0 overflow-hidden border-border/80 p-0 sm:max-w-[640px]"
      >
        <motion.div
          layout
          initial={false}
          animate={{
            width: expanded ? EXPANDED_WIDTH : COMPACT_WIDTH,
          }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="w-full min-w-0"
        >
          <form
            onSubmit={handleSubmit}
            className="flex w-full min-w-0 flex-col"
          >
            <motion.div
              layout
              className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3"
            >
              <motion.div
                layout
                className="flex min-w-0 items-center gap-1.5 text-sm"
              >
                <span className="truncate font-medium text-muted-foreground">
                  {track.trackCode}
                </span>
                <span className="text-muted-foreground/60">›</span>
                <DialogTitle className="truncate text-sm font-medium text-foreground">
                  New task
                </DialogTitle>
              </motion.div>
              <div className="flex shrink-0 items-center gap-0.5">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={expanded ? 'Collapse dialog' : 'Expand dialog'}
                >
                  <motion.span
                    initial={false}
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="inline-flex"
                  >
                    {expanded ? (
                      <RiContractLeftRightLine className="size-4" />
                    ) : (
                      <RiExpandDiagonalLine className="size-4" />
                    )}
                  </motion.span>
                </motion.button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  onClick={() => handleOpenChange(false)}
                  aria-label="Close"
                >
                  <RiCloseLine className="size-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div layout className="px-4 pt-4">
              <TitleInput
                value={title}
                onChange={(markdown) => setTitle(markdown)}
                placeholder="Task title"
                className="text-lg! pb-0!"
              />
              <MotionGlobalTiptapEditor
                layout
                animate={{ height: expanded ? '320px' : '72px' }}
                mode="rich"
                value={description}
                onChange={(value) => setDescription(value)}
                placeholder="Add description…"
              />
            </motion.div>

            <motion.div
              layout
              className="flex flex-wrap items-center gap-1.5 px-4 py-4"
            >
              <TaskStatusPicker
                value={status}
                onSelect={setStatus}
                placeholder="Set status to…"
                trigger={
                  <PropertyChip>
                    <TaskStatusIcon status={status} className="size-3.5" />
                    <span className="text-foreground">{statusLabel}</span>
                  </PropertyChip>
                }
              />

              <TaskPriorityPicker
                value={priority}
                onSelect={setPriority}
                placeholder="Set priority to…"
                trigger={
                  <PropertyChip>
                    <TaskPriorityIcon priority={priority} />
                    <span
                      className={cn(
                        priority === 'medium'
                          ? 'text-muted-foreground'
                          : 'text-foreground',
                      )}
                    >
                      {priority === 'medium' ? 'Priority' : priorityLabel}
                    </span>
                  </PropertyChip>
                }
              />

              <TaskDueDatePicker
                dueDate={dueDateSet ? startOfDay(dueDate).getTime() : null}
                hasDueDate={dueDateSet}
                align="start"
                onSelect={(date) => {
                  setDueDate(date)
                  setDueDateSet(true)
                }}
                onClear={() => setDueDateSet(false)}
                trigger={
                  <PropertyChip>
                    <RiCalendarLine className="size-3.5 shrink-0" />
                    {dueDateSet
                      ? format(dueDate, 'MMM d, yyyy')
                      : 'Set due date'}
                  </PropertyChip>
                }
              />
            </motion.div>

            {error ? (
              <p className="px-4 pb-2 text-sm text-destructive">{error}</p>
            ) : null}

            <motion.div
              layout
              className="flex items-center justify-end gap-2 border-t border-border/60 px-4 py-3"
            >
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="min-w-28"
              >
                {isSubmitting ? 'Creating…' : 'Create task'}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
