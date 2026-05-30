'use client'

import { RiAccountCircle2Line } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../employees/user-avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface TaskMembersPickerProps {
  taskId: Id<'tasks'>
  trackId: Id<'tracks'>
  compact?: boolean
}

export function TaskMembersPicker({
  taskId,
  trackId,
  compact = false,
}: TaskMembersPickerProps) {
  const [open, setOpen] = React.useState(false)
  const membersGroup = useTaskMemberGroups(taskId, trackId)
  const toggleMember = useMutation(api.taskMember.toggleMember)

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
          <span className="flex -space-x-1.5">
            {membersGroup.taskMembers.map((member) => (
              <UserAvatar
                key={member.employeeId}
                className="size-5 border-background border-2"
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
      <PopoverContent align="start" className="p-0 max-w-[260px]">
        <Command
          value={membersGroup.taskMembers
            .map((member) => member.employeeId)
            .join(',')}
        >
          <CommandList>
            <CommandInput placeholder="Set member..." />
            <CommandEmpty>No members found</CommandEmpty>

            {membersGroup.taskMembers.length > 0 && (
              <CommandGroup heading="Assigned members">
                {membersGroup.taskMembers.map((member) => (
                  <CommandItem
                    key={member.employeeId}
                    value={member.employeeId}
                    onSelect={() =>
                      void toggleMember({
                        taskId,
                        employeeId: member.employeeId,
                      })
                    }
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
                    onSelect={() =>
                      void toggleMember({
                        taskId,
                        employeeId: member.employeeId,
                      })
                    }
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
                    onSelect={() =>
                      void toggleMember({ taskId, employeeId: employee.id })
                    }
                  >
                    <UserAvatar
                      className="size-5"
                      name={employee.name}
                      imageUrl={employee.image}
                    />
                    {employee.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function useTaskMemberGroups(taskId: Id<'tasks'>, trackId: Id<'tracks'>) {
  const taskMembers = useQuery(api.taskMember.list, { taskId })
  const trackMembers = useQuery(api.trackMember.list, { trackId })
  const employees = useQuery(api.employees.auth.list)

  const taskMemberIds = new Set(
    (taskMembers ?? []).map((member) => member.employeeId),
  )

  const trackMembersGroup = (trackMembers ?? []).filter(
    (member) => !taskMemberIds.has(member.employeeId),
  )

  const trackMemberGroupIds = new Set(
    trackMembersGroup.map((member) => member.employeeId),
  )

  const organizationMembers = (employees ?? []).filter(
    (employee) =>
      !taskMemberIds.has(employee.id) && !trackMemberGroupIds.has(employee.id),
  )

  return {
    taskMembers: taskMembers ?? [],
    trackMembersGroup,
    organizationMembers,
  }
}
