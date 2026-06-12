'use client'

import * as React from 'react'
import { DeleteSprintDialog } from '@/components/sprints/delete-sprint-dialog'
import { SprintActionsMenuContent } from '@/components/sprints/sprint-actions-menu-content'
import { SprintActionsProvider } from '@/components/sprints/sprint-actions-provider'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { Doc } from '@/convex/_generated/dataModel'

type SprintContextMenuProps = {
  sprint: Doc<'sprints'>
  children: React.ReactElement
}

export function SprintContextMenu({ sprint, children }: SprintContextMenuProps) {
  return (
    <SprintActionsProvider sprint={sprint}>
      <ContextMenu>
        <ContextMenuTrigger className="group/context-menu-trigger">
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-48">
          <SprintActionsMenuContent />
        </ContextMenuContent>
      </ContextMenu>
      <DeleteSprintDialog />
    </SprintActionsProvider>
  )
}
