'use client'

import { useMutation } from 'convex/react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { useTaskMemberGroups } from '@/hooks/use-task-member-groups'
import { useOptionalTaskActionsContext } from '../task-actions-provider'

export function TaskMemberPickerCommand({
  taskId,
  trackId,
  onToggleAssignee,
}: {
  taskId: Id<'tasks'>
  trackId: Id<'tracks'>
  onToggleAssignee?: (employeeId: string) => void
}) {
  const taskActions = useOptionalTaskActionsContext()
  const fallbackGroups = useTaskMemberGroups(taskId, trackId)
  const toggleMember = useMutation(api.taskMember.toggleMember)

  const membersGroup = taskActions?.memberGroups ?? fallbackGroups
  const toggleAssignee =
    onToggleAssignee ??
    taskActions?.toggleAssignee ??
    ((employeeId: string) => {
      void toggleMember({ taskId, employeeId })
    })

  return (
    <Command
      value={membersGroup.taskMembers
        .map((member) => member.employeeId)
        .join(',')}
    >
      <CommandInput placeholder="Set member..." />
      <CommandList>
        <CommandEmpty>No members found</CommandEmpty>
        {membersGroup.taskMembers.length > 0 && (
          <CommandGroup heading="Assigned members">
            {membersGroup.taskMembers.map((member) => (
              <CommandItem
                key={member.employeeId}
                value={member.employeeId}
                onSelect={() => toggleAssignee(member.employeeId)}
                className="w-full"
              >
                <UserAvatar
                  name={member.employee.name}
                  imageUrl={member.employee.image}
                  className="size-5"
                />
                <span className="flex items-center gap-1">
                  {member.employee.name}
                </span>
                {member.lead && <Badge variant="outline">Lead</Badge>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {membersGroup.trackMembersGroup.length > 0 && (
          <CommandGroup heading="Track members group">
            {membersGroup.trackMembersGroup.map((member) => (
              <CommandItem
                key={member.employeeId}
                value={member.employeeId}
                onSelect={() => toggleAssignee(member.employeeId)}
              >
                <UserAvatar
                  className="size-5"
                  name={member.employee.name}
                  imageUrl={member.employee.image}
                />
                {member.employee.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {membersGroup.organizationMembers.length > 0 && (
          <CommandGroup heading="Organization members">
            {membersGroup.organizationMembers.map((employee) => (
              <CommandItem
                key={employee.id}
                value={employee.id}
                onSelect={() => toggleAssignee(employee.id)}
              >
                <UserAvatar
                  className="size-5"
                  name={employee.user.name}
                  imageUrl={employee.user.image}
                />
                {employee.user.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}
