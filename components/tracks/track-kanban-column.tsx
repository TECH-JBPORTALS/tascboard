'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { RiAddLine } from '@remixicon/react'
import * as React from 'react'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { TaskStatusIcon } from '@/components/tasks/task-status-picker'
import { type KanbanTask, TaskCard } from '@/components/tracks/task-card'
import { Button } from '@/components/ui/button'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { type TaskStatus, taskStatusLabels } from '@/lib/task-utils'
import { cn } from '@/lib/utils'
import { Empty, EmptyDescription, EmptyHeader } from '../ui/empty'

type TrackKanbanColumnProps = {
  status: TaskStatus
  tasks: KanbanTask[]
  track: Doc<'tracks'>
  projectId: Id<'projects'>
  projectName: string
}

export function TrackKanbanColumn({
  status,
  tasks,
  track,
  projectId,
  projectName,
}: TrackKanbanColumnProps) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const label = taskStatusLabels[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <>
      <div
        ref={setNodeRef}
        className={cn(
          'flex h-full min-h-0 w-72 shrink-0 flex-col rounded-lg bg-muted/30 ring-1 ring-border/60',
          isOver && 'ring-ring/40 bg-accent/60',
        )}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2">
          <TaskStatusIcon status={status} className="size-3.5" />
          <div className="space-x-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium">
              {label}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {tasks.length}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 ml-auto  text-muted-foreground"
            onClick={() => setCreateOpen(true)}
            aria-label={`Add task to ${label}`}
          >
            <RiAddLine className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
          <SortableContext
            items={tasks.map((task) => task._id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                projectId={projectId}
                projectName={projectName}
              />
            ))}
          </SortableContext>

          {tasks.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  In this column there is no tasks.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </div>
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        track={track}
        projectId={projectId}
        defaultStatus={status}
      />
    </>
  )
}
