'use client'

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useMutation } from 'convex/react'
import { useQuery } from 'convex-helpers/react/cache/hooks'
import * as React from 'react'
import { type KanbanTask, TaskCard } from '@/components/tracks/task-card'
import { TrackKanbanColumn } from '@/components/tracks/track-kanban-column'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import {
  groupTasksByStatus,
  type TaskStatus,
  taskStatusOrder,
} from '@/lib/task-utils'

type TrackKanbanBoardProps = {
  track: Doc<'tracks'>
  projectId: Id<'projects'>
  projectName: string
}

function findStatusForId(
  id: string | number,
  tasksByStatus: Record<TaskStatus, KanbanTask[]>,
): TaskStatus | null {
  if (taskStatusOrder.includes(id as TaskStatus)) {
    return id as TaskStatus
  }

  for (const status of taskStatusOrder) {
    if (tasksByStatus[status].some((task) => task._id === id)) {
      return status
    }
  }

  return null
}

export function TrackKanbanBoard({
  track,
  projectId,
  projectName,
}: TrackKanbanBoardProps) {
  const tasks = useQuery(api.task.list, { trackId: track._id })
  const reorderKanban = useMutation(api.task.reorderKanban)
  const [activeTask, setActiveTask] = React.useState<KanbanTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const tasksByStatus = React.useMemo(() => {
    if (!tasks) {
      return Object.fromEntries(
        taskStatusOrder.map((status) => [status, [] as KanbanTask[]]),
      ) as Record<TaskStatus, KanbanTask[]>
    }

    return groupTasksByStatus(tasks)
  }, [tasks])

  const tasksById = React.useMemo(() => {
    const map = new Map<Id<'tasks'>, KanbanTask>()
    for (const task of tasks ?? []) {
      map.set(task._id, task)
    }
    return map
  }, [tasks])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over || !tasks) return

    const activeId = active.id as Id<'tasks'>
    const activeTaskDoc = tasksById.get(activeId)
    if (!activeTaskDoc) return

    const overStatus = findStatusForId(over.id, tasksByStatus)
    if (!overStatus) return

    const columnTasks = tasksByStatus[overStatus].filter(
      (task) => task._id !== activeId,
    )

    let newIndex: number
    if (taskStatusOrder.includes(over.id as TaskStatus)) {
      newIndex = columnTasks.length
    } else {
      newIndex = columnTasks.findIndex((task) => task._id === over.id)
      if (newIndex === -1) {
        newIndex = columnTasks.length
      }
    }

    void reorderKanban({
      taskId: activeId,
      status: overStatus,
      statusOrder: newIndex,
    })
  }

  if (tasks === undefined) {
    return null
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(event) => {
        const task = tasksById.get(event.active.id as Id<'tasks'>)
        setActiveTask(task ?? null)
      }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex h-full min-h-full flex-1 gap-4 overflow-x-auto p-4">
        {taskStatusOrder.map((status) => (
          <TrackKanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            track={track}
            projectId={projectId}
            projectName={projectName}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            projectId={projectId}
            projectName={projectName}
            className="rotate-2 shadow-md"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
