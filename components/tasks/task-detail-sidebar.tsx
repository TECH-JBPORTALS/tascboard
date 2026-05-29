'use client'

import {
  RiAddFill,
  RiCalendarTodoFill,
  RiSideBarFill,
  RiSideBarLine,
  RiStackLine,
} from '@remixicon/react'
import { format, isAfter } from 'date-fns'
import Link from 'next/link'
import { TaskDueDatePicker } from '@/components/tasks/task-due-date-picker'
import { TaskLabelPicker } from '@/components/tasks/task-label-picker'
import { TaskMembersPicker } from '@/components/tasks/task-members-picker'
import {
  TaskPriorityIcon,
  TaskPriorityPicker,
} from '@/components/tasks/task-priority-picker'
import {
  TaskStatusIcon,
  TaskStatusPicker,
} from '@/components/tasks/task-status-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Doc } from '@/convex/_generated/dataModel'
import { taskPriorityConfig, taskStatusConfig } from '@/lib/task-utils'
import { cn } from '@/lib/utils'

type TaskRightBarToggleProps = {
  open: boolean
  onToggle: () => void
  className?: string
}

type TaskRightBarProps = {
  orgSlug: string
  task: Doc<'tasks'>
  project: Doc<'projects'>
  labels: Doc<'labels'>[]
  open: boolean
  className?: string
}

function SidebarRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-8 items-start gap-3 text-sm">
      <span className="w-20 shrink-0 pt-1 text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function PropertyChip({
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

export function TaskRightBarToggle({
  open,
  onToggle,
  className,
}: TaskRightBarToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn('text-muted-foreground', className)}
      onClick={onToggle}
      aria-expanded={!open}
      aria-label={open ? 'Hide task sidebar' : 'Show task sidebar'}
    >
      {open ? <RiSideBarLine /> : <RiSideBarFill />}
    </Button>
  )
}

function TaskPropertiesContent({
  orgSlug,
  task,
  project,
  labels,
}: Omit<TaskRightBarProps, 'open' | 'className'>) {
  const statusLabel = taskStatusConfig[task.status].label
  const priorityLabel = taskPriorityConfig[task.priority].label

  return (
    <CardContent className="space-y-6">
      <SidebarRow label="Status">
        <TaskStatusPicker
          taskId={task._id}
          value={task.status}
          trigger={
            <PropertyChip>
              <TaskStatusIcon status={task.status} className="size-3.5" />
              <span>{statusLabel}</span>
            </PropertyChip>
          }
        />
      </SidebarRow>

      <SidebarRow label="Priority">
        <TaskPriorityPicker
          taskId={task._id}
          value={task.priority}
          trigger={
            <PropertyChip>
              <TaskPriorityIcon priority={task.priority} />
              <span>{priorityLabel}</span>
            </PropertyChip>
          }
        />
      </SidebarRow>

      <SidebarRow label="Members">
        <TaskMembersPicker taskId={task._id} trackId={task.trackId} />
      </SidebarRow>

      <SidebarRow label="Due date">
        <TaskDueDatePicker
          taskId={task._id}
          dueDate={task.dueDate}
          align="end"
          trigger={
            <PropertyChip>
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
              {task.dueDate ? format(task.dueDate, 'MMM d, yyyy') : 'Set due'}
            </PropertyChip>
          }
        />
      </SidebarRow>

      <div className="space-y-2">
        <TaskLabelPicker
          taskId={task._id}
          projectId={project._id}
          projectName={project.name}
          attachedLabels={labels}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RiStackLine className="size-3.5" />
          <span>Project</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-full justify-start gap-1.5 font-normal"
          render={<Link href={`/${orgSlug}/pro/${project._id}`} />}
          nativeButton={false}
        >
          {project.name}
        </Button>
      </div>
    </CardContent>
  )
}

export function TaskRightBar({
  orgSlug,
  task,
  project,
  labels,
  open,
  className,
}: TaskRightBarProps) {
  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-96 shrink-0 flex-col overflow-hidden bg-transparent transition-transform translate-x-0 duration-300',
        className,
        open && 'translate-x-100 w-0',
      )}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col bg-transparent py-5">
        <ScrollArea className="min-h-0 flex-1 px-3 pb-3">
          <Card className="border bg-card/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Properties
              </CardTitle>
            </CardHeader>
            <TaskPropertiesContent
              orgSlug={orgSlug}
              task={task}
              project={project}
              labels={labels}
            />
          </Card>
        </ScrollArea>
      </div>
    </aside>
  )
}
