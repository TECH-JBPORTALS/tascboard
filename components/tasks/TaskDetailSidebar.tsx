'use client'

import {
  RiAddFill,
  RiCalendarLine,
  RiCalendarTodoFill,
  RiStackLine,
} from '@remixicon/react'
import { format, isAfter } from 'date-fns'
import Link from 'next/link'
import { TaskDueDatePicker } from '@/components/tasks/TaskDueDatePicker'
import { TaskLabelPicker } from '@/components/tasks/TaskLabelPicker'
import { TaskMembersPicker } from '@/components/tasks/TaskMembersPicker'
import {
  TaskPriorityIcon,
  TaskPriorityPicker,
} from '@/components/tasks/TaskPriorityPicker'
import {
  TaskStatusIcon,
  TaskStatusPicker,
} from '@/components/tasks/TaskStatusPicker'
import { Button } from '@/components/ui/button'
import type { Doc } from '@/convex/_generated/dataModel'
import { taskPriorityConfig, taskStatusConfig } from '@/lib/task-utils'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card'

type TaskDetailSidebarProps = {
  orgSlug: string
  task: Doc<'tasks'>
  project: Doc<'projects'>
  labels: Doc<'labels'>[]
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

export function TaskDetailSidebar({
  orgSlug,
  task,
  project,
  labels,
}: TaskDetailSidebarProps) {
  const statusLabel = taskStatusConfig[task.status].label
  const priorityLabel = taskPriorityConfig[task.priority].label

  return (
    <Card className="h-fit w-full shrink-0 lg:sticky lg:top-6 lg:ml-auto lg:mr-4 lg:w-72 lg:self-start">
      <CardHeader>
        <CardDescription>PROPERTIES</CardDescription>
      </CardHeader>
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
    </Card>
  )
}
