'use client'

import { RiAccountCircle2Line } from '@remixicon/react'
import * as React from 'react'
import { TaskMemberPickerCommand } from '@/components/tasks/command/task-member-picker.command'
import { useOptionalTaskActionsContext } from '@/components/tasks/task-actions-provider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Id } from '@/convex/_generated/dataModel'
import { useTaskMemberGroups } from '@/hooks/use-task-member-groups'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../employees/user-avatar'
import { Button } from '../ui/button'

interface TaskMembersPickerProps {
  taskId: Id<'tasks'>
  trackId: Id<'tracks'>
  compact?: boolean
  onToggleAssignee?: (employeeId: string) => void
}

export function TaskMembersPicker({
  taskId,
  trackId,
  compact = false,
  onToggleAssignee,
}: TaskMembersPickerProps) {
  const [open, setOpen] = React.useState(false)
  const taskActions = useOptionalTaskActionsContext()
  const fallbackGroups = useTaskMemberGroups(taskId, trackId)

  const membersGroup = taskActions?.memberGroups ?? fallbackGroups

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 gap-1.5 px-2 rounded-full font-normal text-muted-foreground hover:text-foreground',
            )}
          />
        }
      >
        {membersGroup.taskMembers.length > 0 ? (
          <span className="flex -space-x-2.5">
            {membersGroup.taskMembers.map((member) => (
              <UserAvatar
                key={member.employeeId}
                className="size-6 border-card border-2"
                name={member.employee.name}
                imageUrl={member.employee.image}
              />
            ))}
          </span>
        ) : (
          <>
            <RiAccountCircle2Line className="size-3.5 opacity-70" />
            {!compact ? 'Assign' : null}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 min-w-64">
        <TaskMemberPickerCommand
          taskId={taskId}
          trackId={trackId}
          onToggleAssignee={onToggleAssignee}
        />
      </PopoverContent>
    </Popover>
  )
}
