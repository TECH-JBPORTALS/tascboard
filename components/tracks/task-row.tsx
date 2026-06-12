'use client'

import { RiAddFill, RiCalendarTodoFill } from '@remixicon/react'
import { format, isAfter } from 'date-fns'
import Link from 'next/link'
import { useTaskActionsContext } from '@/components/tasks/task-actions-provider'
import { TaskContextMenu } from '@/components/tasks/task-context-menu'
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
import type { Doc } from '@/convex/_generated/dataModel'
import { useTaskHref } from '@/hooks/use-task-href'
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

function TaskRowContent({
  task,
  className,
  showMembers = true,
  showSprint,
}: TaskRowProps) {
  const href = useTaskHref(task._id)
  const sprintLabel = useSprintDisplayLabel(task.trackId, task.sprintId)
  const { setStatus, setSprint, setDueDate, clearDueDate } =
    useTaskActionsContext()

  return (
    <div
      className={cn(
        'group flex h-9 group-data-popup-open/context-menu-trigger:bg-muted group-data-popup-open/context-menu-trigger:ring-1 group-data-popup-open/context-menu-trigger:ring-muted-foreground/30 items-center gap-2 px-3 text-sm hover:bg-muted/40',
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
        value={task.status}
        onSelect={setStatus}
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
          trackId={task.trackId}
          value={task.sprintId}
          onSelect={setSprint}
          trigger={
            <RowTrigger
              variant={task.sprintId ? 'outline' : 'ghost'}
              className="text-xs text-muted-foreground rounded-full"
              size={'xs'}
              aria-label="Change sprint"
            >
              {task.sprintId ? (
                <>
                  <TaskSprintIcon className={cn('size-4')} /> {sprintLabel}
                </>
              ) : (
                <>
                  <RiAddFill />
                  Set sprint
                </>
              )}
            </RowTrigger>
          }
        />
      )}

      <TaskDueDatePicker
        dueDate={task.dueDate}
        onSelect={setDueDate}
        onClear={clearDueDate}
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
        <TaskMembersPicker taskId={task._id} trackId={task.trackId} />
      )}

      <span className="hidden w-14 shrink-0 text-right text-xs text-muted-foreground md:inline">
        {format(task.createdAt, 'MMM d')}
      </span>
    </div>
  )
}

export function TaskRow(props: TaskRowProps) {
  return (
    <TaskContextMenu task={props.task}>
      <TaskRowContent {...props} />
    </TaskContextMenu>
  )
}
