'use client'

import {
  RiAddFill,
  RiCalendarTodoFill,
  RiCheckboxBlankCircleLine,
  RiCheckboxCircleFill,
} from '@remixicon/react'
import { format, isAfter } from 'date-fns'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TaskDueDatePicker } from '@/components/tasks/task-due-date-picker'
import { TaskMembersPicker } from '@/components/tasks/task-members-picker'
import {
  TaskPriorityIcon,
  TaskPriorityPicker,
} from '@/components/tasks/task-priority-picker'
import {
  TaskStatusIcon,
  TaskStatusPicker,
} from '@/components/tasks/task-status-picker'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { formatSprintLabel, sprintStatusConfig } from '@/lib/track-utils'
import { cn } from '@/lib/utils'
import {
  TaskSprintIcon,
  TaskSprintPicker,
  useSprintDisplayLabel,
} from '../tasks/task-sprint-picker'
import { Button } from '../ui/button'

export type TaskRowProps = {
  task: Doc<'tasks'>
  className?: string
  showMembers?: boolean
  showSprint?: boolean
}

function RowTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  )
}

export function TaskRow({
  task,
  className,
  showMembers = true,
  showSprint,
}: TaskRowProps) {
  const params = useParams<{
    orgSlug: string
    projectId: string
    trackId: string
  }>()

  const sprintLabel = useSprintDisplayLabel(task.trackId, task.sprintId)
  const href = `/${params.orgSlug}/pro/${params.projectId}/track/${params.trackId}/task/${task._id}`

  return (
    <div
      className={cn(
        'group flex h-9 items-center gap-2 px-3 text-sm hover:bg-muted/40',
        className,
      )}
    >
      <TaskPriorityPicker
        taskId={task._id}
        value={task.priority}
        trigger={
          <RowTrigger className="size-6" aria-label="Change priority">
            <TaskPriorityIcon priority={task.priority} />
          </RowTrigger>
        }
      />

      <Link
        href={href}
        className="w-18 shrink-0 truncate font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        {task.taskCode}
      </Link>

      <TaskStatusPicker
        taskId={task._id}
        value={task.status}
        trigger={
          <RowTrigger className="size-6" aria-label="Change status">
            <TaskStatusIcon status={task.status} className="size-4" />
          </RowTrigger>
        }
      />

      <Link
        href={href}
        className="min-w-0 flex-1 truncate hover:text-foreground"
      >
        {task.title}
      </Link>

      {showSprint && (
        <TaskSprintPicker
          taskId={task._id}
          value={task.sprintId}
          trigger={
            <RowTrigger
              className="text-xs text-muted-foreground"
              size={'sm'}
              aria-label="Change sprint"
            >
              <TaskSprintIcon className={cn('size-4')} />{' '}
              {task.sprintId ? sprintLabel : 'No sprint'}
            </RowTrigger>
          }
          trackId={task.trackId}
        />
      )}

      <TaskDueDatePicker
        taskId={task._id}
        dueDate={task.dueDate}
        trigger={
          <RowTrigger
            className="hidden h-6 gap-1 px-1.5 text-xs text-muted-foreground sm:inline-flex"
            aria-label="Change due date"
          >
            {task.dueDate ? (
              <RiCalendarTodoFill
                className={cn(
                  isAfter(task.dueDate, new Date())
                    ? 'text-muted-foreground'
                    : 'text-destructive',
                )}
              />
            ) : (
              <RiAddFill />
            )}
            {task.dueDate ? format(task.dueDate, 'MMM d') : 'Set due'}
          </RowTrigger>
        }
      />

      {showMembers && (
        <TaskMembersPicker taskId={task._id} trackId={task.trackId} compact />
      )}

      <span className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground md:inline">
        {format(task.createdAt, 'MMM d')}
      </span>
    </div>
  )
}
