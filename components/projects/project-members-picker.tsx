'use client'

import { RiAccountCircle2Line } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
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

interface ProjectMembersPickerProps {
  projectId: Id<'projects'>
}

export function ProjectMembersPicker({ projectId }: ProjectMembersPickerProps) {
  const [open, setOpen] = React.useState(false)
  const membersGroup = useProjectMembers(projectId)
  const toggleMember = useMutation(api.projectMember.toggleMember)

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
        {membersGroup?.projectMembers.length > 0 ? (
          <span className="flex -space-x-1.5">
            {membersGroup?.projectMembers?.map((member) => (
              <UserAvatar
                key={member.employeeId}
                className="size-4"
                name={member.employee.name}
                imageUrl={member.employee.image}
              />
            ))}
          </span>
        ) : (
          <>
            <RiAccountCircle2Line className="size-3.5 opacity-70" />
            Assign
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 max-w-[240px]">
        <Command
          value={membersGroup?.projectMembers
            ?.map((member) => member.employeeId)
            .join(',')}
        >
          <CommandList>
            <CommandInput placeholder="Set member..." />
            <CommandEmpty>No members found</CommandEmpty>

            <CommandGroup>
              {membersGroup.projectMembers.map((member) => (
                <CommandItem
                  key={member.employeeId}
                  value={member.employeeId}
                  onSelect={() =>
                    toggleMember({ projectId, employeeId: member.employeeId })
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
                  {member.manager && <Badge variant={'outline'}>Manager</Badge>}
                </CommandItem>
              ))}
            </CommandGroup>
            {membersGroup.organizationMembers.length > 0 && (
              <CommandGroup heading="Organization members">
                {membersGroup.organizationMembers.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={employee.id}
                    onSelect={() =>
                      toggleMember({ projectId, employeeId: employee.id })
                    }
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
      </PopoverContent>
    </Popover>
  )
}

export function useProjectMembers(projectId: Id<'projects'>) {
  const members = useQuery(api.projectMember.list, {
    projectId,
  })

  const employees = useQuery(api.auth.listEmployees)

  const remainingEmployees = employees?.filter(
    (employee) => !members?.some((member) => member.employeeId === employee.id),
  )

  return {
    projectMembers: members ?? [],
    organizationMembers: remainingEmployees ?? [],
  }
}
