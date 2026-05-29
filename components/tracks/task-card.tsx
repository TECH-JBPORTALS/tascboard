'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { RiAddFill, RiDraggable } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { TaskLabelPicker } from '@/components/tasks/task-label-picker'
import { TaskMembersPicker } from '@/components/tasks/task-members-picker'
import {
  TaskPriorityIcon,
  TaskPriorityPicker,
} from '@/components/tasks/task-priority-picker'
import {
  TaskSprintIcon,
  TaskSprintPicker,
  useSprintDisplayLabel,
} from '@/components/tasks/task-sprint-picker'
import {
  TaskStatusIcon,
  TaskStatusPicker,
} from '@/components/tasks/task-status-picker'
import { TitleInput } from '@/components/title-input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

export type KanbanTask = Doc<'tasks'>

export type TaskCardProps = {
  task: KanbanTask
  projectId: Id<'projects'>
  projectName: string
  className?: string
}

function ChipTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className={cn(className)}
      {...props}
    >
      {children}
    </Button>
  )
}

export function TaskCard({
  task,
  projectId,
  projectName,
  className,
}: TaskCardProps) {
  const updateTask = useMutation(api.task.update)
  const labels = useQuery(api.label.listTaskLabels, { taskId: task._id })
  const sprintLabel = useSprintDisplayLabel(task.trackId, task.sprintId)
  const [title, setTitle] = React.useState(task.title)

  React.useEffect(() => {
    setTitle(task.title)
  }, [task.title])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: task._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function saveTitle(nextTitle: string) {
    const trimmed = nextTitle.trim()
    if (!trimmed || trimmed === task.title) return
    await updateTask({
      taskId: task._id,
      body: { title: trimmed },
    })
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      size="sm"
      className={cn(
        isDragging && 'opacity-0',
        isOver && 'ring-2 ring-ring/40',
        className,
      )}
    >
      <CardContent className="pl-0! pb-3!">
        <div className="flex items-start gap-1">
          <Button
            className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 active:cursor-grabbing"
            aria-label="Drag task"
            variant={'ghost'}
            size={'icon-sm'}
            {...attributes}
            {...listeners}
          >
            <RiDraggable />
          </Button>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs px-0.5 font-medium text-muted-foreground">
                #{task.taskCode}
              </span>
              <TaskMembersPicker
                taskId={task._id}
                trackId={task.trackId}
                compact
              />
            </div>

            <div className="flex items-start gap-0.5">
              <TaskStatusPicker
                taskId={task._id}
                value={task.status}
                trigger={
                  <ChipTrigger
                    aria-label="Change status"
                    size={'icon-xs'}
                    variant={'ghost'}
                    className={'mt-1'}
                  >
                    <TaskStatusIcon status={task.status} className="size-3.5" />
                  </ChipTrigger>
                }
              />

              <TitleInput
                value={title}
                onChange={setTitle}
                onSave={saveTitle}
                placeholder="Untitled task"
                aria-label="Task title"
                className="min-w-0 flex-1 pb-0 mb-1 pt-0 text-sm! font-medium! leading-snug!"
                blurOnSave
              />
            </div>

            <div className="flex flex-wrap items-center gap-1 pl-0.5">
              <TaskPriorityPicker
                taskId={task._id}
                value={task.priority}
                trigger={
                  <ChipTrigger
                    className="size-6 px-0"
                    aria-label="Change priority"
                  >
                    <TaskPriorityIcon priority={task.priority} />
                  </ChipTrigger>
                }
              />

              <TaskSprintPicker
                taskId={task._id}
                trackId={task.trackId}
                value={task.sprintId}
                trigger={
                  <ChipTrigger aria-label="Change sprint">
                    <TaskSprintIcon className="size-3" />
                    {sprintLabel ? (
                      <span className="max-w-16 truncate">{sprintLabel}</span>
                    ) : (
                      <RiAddFill className="size-3" />
                    )}
                  </ChipTrigger>
                }
              />

              {labels !== undefined ? (
                <TaskLabelPicker
                  taskId={task._id}
                  projectId={projectId}
                  projectName={projectName}
                  attachedLabels={labels}
                />
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
