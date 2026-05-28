'use client'

import { RiAccountCircle2Line, RiCheckFill } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../employees/user-avatar'
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

type ProjectManager = NonNullable<typeof api.project.get._returnType>['manager']
interface ProjectManagerPickerProps {
  projectId: Id<'projects'>
  manager: ProjectManager
}

export function ProjectMangerPicker({
  projectId,
  manager,
}: ProjectManagerPickerProps) {
  const [open, setOpen] = React.useState(false)
  const membersGroup = useProjectMembers(projectId)
  const setManager = useMutation(api.projectMember.setManager)
  const removeManager = useMutation(api.projectMember.removeManager)

  const currentManager = membersGroup.projectMembers.find(
    (member) => member.employeeId === manager?.employeeId,
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 gap-1.5 px-2 font-normal text-muted-foreground hover:text-foreground rounded-full',
            )}
          />
        }
      >
        {currentManager ? (
          <UserAvatar
            className="size-4"
            name={currentManager.employee.name}
            imageUrl={currentManager.employee.image}
          />
        ) : (
          <RiAccountCircle2Line className="size-3.5 opacity-70" />
        )}
        <span>{currentManager?.employee.name ?? 'Manager'}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 max-w-[240px]">
        <Command>
          <CommandList>
            <CommandInput placeholder="Set manager…" />
            <CommandEmpty>No members found</CommandEmpty>
            {currentManager && (
              <CommandGroup>
                <CommandItem
                  value="no manager"
                  onSelect={() =>
                    removeManager({
                      projectId,
                      employeeId: currentManager.employeeId,
                    })
                  }
                >
                  <RiAccountCircle2Line className="size-5 text-muted-foreground opacity-70" />
                  No manager
                </CommandItem>
                {membersGroup.projectMembers.map((member) => (
                  <CommandItem
                    key={member.employeeId}
                    value={member.employeeId}
                  >
                    <UserAvatar
                      name={member.employee.name}
                      imageUrl={member.employee.image}
                      className="size-5"
                    />
                    {member.employee.name}{' '}
                    {member.manager && (
                      <RiCheckFill className="ml-auto size-4 " />
                    )}
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
                      setManager({ projectId, employeeId: employee.id })
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

export function useProjectMembers(projectId: Id<'projects'>) {
  const members = useQuery(api.projectMember.list, {
    projectId,
  })

  const employees = useQuery(api.employees.auth.list)

  const remainingEmployees = employees?.filter((employee) => {
    const existingMember = members?.find(
      (member) => member.employeeId === employee.id,
    )
    return !existingMember || !existingMember.manager
  })

  return {
    projectMembers: members?.filter((member) => member.manager) ?? [],
    organizationMembers: remainingEmployees ?? [],
  }
}
