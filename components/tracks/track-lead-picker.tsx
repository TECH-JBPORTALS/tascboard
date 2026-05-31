'use client'

import { RiAccountCircle2Line, RiCheckFill } from '@remixicon/react'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
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

interface TrackLeadPickerProps {
  trackId: Id<'tracks'>
  projectId: Id<'projects'>
  trackLeaderId?: string
}

interface TrackLeadDraftPickerProps {
  projectId: Id<'projects'>
  leadEmployeeId: string
  onLeadChange: (employeeId: string) => void
}

export function TrackLeadPicker({
  trackId,
  projectId,
  trackLeaderId,
}: TrackLeadPickerProps) {
  const [open, setOpen] = React.useState(false)
  const membersGroup = useTrackMemberGroups(trackId, projectId)
  const setLead = useMutation(api.trackMember.setLead)
  const unsetLead = useMutation(api.trackMember.unsetLead)

  const currentLead =
    membersGroup.trackMembers.find((member) => member.lead) ?? null

  const displayName = currentLead?.employee.name ?? 'Lead'
  const displayImage = currentLead?.employee.image ?? ''

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
        {displayImage ? (
          <UserAvatar
            className="size-4"
            name={displayName}
            imageUrl={displayImage}
          />
        ) : (
          <RiAccountCircle2Line className="size-3.5 opacity-70" />
        )}
        <span>{displayName}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 max-w-[240px]">
        <Command>
          <CommandList>
            <CommandInput placeholder="Set lead…" />
            <CommandEmpty>No members found</CommandEmpty>
            {currentLead && (
              <CommandGroup>
                <CommandItem
                  value="no lead"
                  onSelect={() =>
                    void unsetLead({
                      trackId,
                      employeeId: currentLead.employeeId,
                    })
                  }
                >
                  <RiAccountCircle2Line className="size-5 text-muted-foreground opacity-70" />
                  No lead
                </CommandItem>
                {membersGroup.trackMembers.map((member) => (
                  <CommandItem
                    key={member.employeeId}
                    value={member.employeeId}
                    onSelect={() =>
                      void setLead({ trackId, employeeId: member.employeeId })
                    }
                  >
                    <UserAvatar
                      name={member.employee.name}
                      imageUrl={member.employee.image}
                      className="size-5"
                    />
                    {member.employee.name}
                    {member.lead && <RiCheckFill className="ml-auto size-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {membersGroup.projectGroup.length > 0 && (
              <CommandGroup heading="Project group">
                {membersGroup.projectGroup.map((member) => (
                  <CommandItem
                    key={member.employeeId}
                    value={member.employeeId}
                    onSelect={() =>
                      void setLead({ trackId, employeeId: member.employeeId })
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
                      void setLead({ trackId, employeeId: employee.id })
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

export function TrackLeadDraftPicker({
  projectId,
  leadEmployeeId,
  onLeadChange,
}: TrackLeadDraftPickerProps) {
  const [open, setOpen] = React.useState(false)
  const membersGroup = useTrackLeadDraftCandidates(projectId)

  const currentLead =
    membersGroup.projectGroup.find(
      (member) => member.employeeId === leadEmployeeId,
    ) ??
    membersGroup.organizationMembers.find(
      (member) => member.id === leadEmployeeId,
    ) ??
    null

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
        {currentLead ? (
          <UserAvatar
            className="size-4"
            name={
              'employee' in currentLead
                ? currentLead.employee.name
                : currentLead.user.name
            }
            imageUrl={
              'employee' in currentLead
                ? currentLead.employee.image
                : currentLead.user.image
            }
          />
        ) : (
          <RiAccountCircle2Line className="size-3.5 opacity-70" />
        )}
        <span>
          {currentLead
            ? 'employee' in currentLead
              ? currentLead.employee.name
              : currentLead.user.name
            : 'Lead'}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0 max-w-[240px]">
        <Command>
          <CommandList>
            <CommandInput placeholder="Set lead…" />
            <CommandEmpty>No members found</CommandEmpty>
            {membersGroup.projectGroup.length > 0 && (
              <CommandGroup heading="Project group">
                {membersGroup.projectGroup.map((member) => (
                  <CommandItem
                    key={member.employeeId}
                    value={member.employeeId}
                    onSelect={() => onLeadChange(member.employeeId)}
                  >
                    <UserAvatar
                      className="size-5"
                      name={member.employee.name}
                      imageUrl={member.employee.image}
                    />
                    {member.employee.name}
                    {leadEmployeeId === member.employeeId && (
                      <RiCheckFill className="ml-auto size-4" />
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
                    onSelect={() => onLeadChange(employee.id)}
                  >
                    <UserAvatar
                      className="size-5"
                      name={employee.user.name}
                      imageUrl={employee.user.image}
                    />
                    {employee.user.name}
                    {leadEmployeeId === employee.id && (
                      <RiCheckFill className="ml-auto size-4" />
                    )}
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

export function useTrackMemberGroups(
  trackId: Id<'tracks'>,
  projectId: Id<'projects'>,
) {
  const trackMembers = useQuery(api.trackMember.list, { trackId })
  const projectMembers = useQuery(api.projectMember.list, { projectId })
  const employees = useQuery(api.employees.list)

  const trackMemberIds = new Set(
    (trackMembers ?? []).map((member) => member.employeeId),
  )

  const projectGroup = (projectMembers ?? []).filter(
    (member) => !trackMemberIds.has(member.employeeId),
  )

  const projectGroupIds = new Set(
    projectGroup.map((member) => member.employeeId),
  )

  const organizationMembers = (employees ?? []).filter(
    (employee) =>
      !trackMemberIds.has(employee.id) && !projectGroupIds.has(employee.id),
  )

  return {
    trackMembers: trackMembers ?? [],
    projectGroup,
    organizationMembers,
  }
}

function useTrackLeadDraftCandidates(projectId: Id<'projects'>) {
  const projectMembers = useQuery(api.projectMember.list, { projectId })
  const employees = useQuery(api.employees.list)

  const projectMemberIds = new Set(
    (projectMembers ?? []).map((member) => member.employeeId),
  )

  const organizationMembers = (employees ?? []).filter(
    (employee) => !projectMemberIds.has(employee.id),
  )

  return {
    projectGroup: projectMembers ?? [],
    organizationMembers,
  }
}
