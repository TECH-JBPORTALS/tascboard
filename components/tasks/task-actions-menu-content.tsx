'use client'

import { TaskDueDatePickerCommand } from '@/components/tasks/command/task-due-date-picker.command'
import { TaskLabelPickerCommand } from '@/components/tasks/command/task-label-picker.command'
import { TaskMemberPickerCommand } from '@/components/tasks/command/task-member-picker.command'
import { TaskPriorityPickerCommand } from '@/components/tasks/command/task-priority-picker.command'
import { TaskSprintPickerCommand } from '@/components/tasks/command/task-sprint-picker.command'
import { TaskStatusPickerCommand } from '@/components/tasks/command/task-status-picker.command'
import { useTaskActionsContext } from '@/components/tasks/task-actions-provider'
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'

export function TaskActionsMenuContent() {
  const { task, setDeleteDialogOpen } = useTaskActionsContext()

  return (
    <>
      <ContextMenuSub>
        <ContextMenuSubTrigger>Assign task…</ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 min-w-56 p-0">
          <TaskMemberPickerCommand taskId={task._id} trackId={task.trackId} />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>Change status…</ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 min-w-56 p-0">
          <TaskStatusPickerCommand />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>Change priority…</ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 min-w-56 p-0">
          <TaskPriorityPickerCommand />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>Set due date…</ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 min-w-64 p-0">
          <TaskDueDatePickerCommand />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>Set sprint …</ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 min-w-56 p-0">
          <TaskSprintPickerCommand trackId={task.trackId} />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>Set label …</ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 min-w-48 p-0">
          <TaskLabelPickerCommand
            projectId={task.projectId}
            allowCreate={false}
            placeholder="Search labels…"
          />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      <ContextMenuItem
        variant="destructive"
        onClick={() => setDeleteDialogOpen(true)}
      >
        Delete task...
      </ContextMenuItem>
    </>
  )
}
