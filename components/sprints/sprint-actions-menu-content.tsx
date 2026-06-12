'use client'

import { SprintStatusPickerCommand } from '@/components/sprints/commands/sprint-status-picker.command'
import { useSprintActionsContext } from '@/components/sprints/sprint-actions-provider'
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'

export function SprintActionsMenuContent() {
  const { setDeleteDialogOpen } = useSprintActionsContext()

  return (
    <>
      <ContextMenuSub>
        <ContextMenuSubTrigger>Change status…</ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 min-w-56 p-0">
          <SprintStatusPickerCommand />
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      <ContextMenuItem
        variant="destructive"
        onClick={() => setDeleteDialogOpen(true)}
      >
        Delete sprint...
      </ContextMenuItem>
    </>
  )
}
