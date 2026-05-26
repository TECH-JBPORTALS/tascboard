'use client'

import { RiAccountCircle2Line } from '@remixicon/react'
import { useMutation } from 'convex/react'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { UserAvatar } from '../employees/UserAvatar'
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
import { useTrackMemberGroups } from './TrackLeadPicker'

interface TrackMembersPickerProps {
  trackId: Id<'tracks'>
  projectId: Id<'projects'>
}

export function TrackMembersPicker({
  trackId,
  projectId,
}: TrackMembersPickerProps) {
  const [open, setOpen] = React.useState(false)
  const membersGroup = useTrackMemberGroups(trackId, projectId)
  const toggleMember = useMutation(api.trackMember.toggleMember)

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
        {membersGroup.trackMembers.length > 0 ? (
          <span className="flex -space-x-1.5">
            {membersGroup.trackMembers.map((member) => (
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
          value={membersGroup.trackMembers
            .map((member) => member.employeeId)
            .join(',')}
        >
          <CommandList>
            <CommandInput placeholder="Set member..." />
            <CommandEmpty>No members found</CommandEmpty>

            <CommandGroup>
              {membersGroup.trackMembers.map((member) => (
                <CommandItem
                  key={member.employeeId}
                  value={member.employeeId}
                  onSelect={() =>
                    void toggleMember({
                      trackId,
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

            {membersGroup.projectGroup.length > 0 && (
              <CommandGroup heading="Project group">
                {membersGroup.projectGroup.map((member) => (
                  <CommandItem
                    key={member.employeeId}
                    value={member.employeeId}
                    onSelect={() =>
                      void toggleMember({
                        trackId,
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
                      void toggleMember({ trackId, employeeId: employee.id })
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
