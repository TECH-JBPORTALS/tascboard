'use client'

import * as React from 'react'
import { DeleteTaskDialog } from '@/components/tasks/delete-task-dialog'
import { TaskActionsMenuContent } from '@/components/tasks/task-actions-menu-content'
import { TaskActionsProvider } from '@/components/tasks/task-actions-provider'
import { TaskDueDateCustomDialog } from '@/components/tasks/task-due-date-custom-dialog'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { Doc } from '@/convex/_generated/dataModel'

type TaskContextMenuProps = {
  task: Doc<'tasks'>
  children: React.ReactElement
}

export function TaskContextMenu({ task, children }: TaskContextMenuProps) {
  return (
    <TaskActionsProvider task={task}>
      <ContextMenu>
        <ContextMenuTrigger className={'group/context-menu-trigger'}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-48">
          <TaskActionsMenuContent />
        </ContextMenuContent>
      </ContextMenu>
      <DeleteTaskDialog />
      <TaskDueDateCustomDialog />
    </TaskActionsProvider>
  )
}
