'use client'

import { RiAccountCircle2Line } from '@remixicon/react'
import { useQuery } from 'convex/react'
import { useState } from 'react'

import { UserAvatar } from '@/components/employees/user-avatar'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'

interface MeetingAttendeePickerProps {
  selected: string[]
  onChange: (ids: string[]) => void
}

export function MeetingAttendeePicker({
  selected,
  onChange,
}: MeetingAttendeePickerProps) {
  const [open, setOpen] = useState(false)
  const employees = useQuery(api.employees.auth.list)

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" />}
      >
        {selected.length > 0 ? (
          <span className="flex -space-x-1.5">
            {(employees ?? [])
              .filter((e) => selected.includes(e.id))
              .slice(0, 4)
              .map((e) => (
                <UserAvatar key={e.id} name={e.name} imageUrl={e.image} className="size-5" />
              ))}
            {selected.length > 4 && (
              <span className="text-xs text-muted-foreground pl-2">
                +{selected.length - 4}
              </span>
            )}
          </span>
        ) : (
          <>
            <RiAccountCircle2Line />
            Add Attendees
          </>
        )}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search employees..." />
            <CommandEmpty>No employees found.</CommandEmpty>
            <CommandGroup>
              {(employees ?? []).map((e) => (
                <CommandItem
                  key={e.id}
                  value={e.id}
                  onSelect={() => toggle(e.id)}
                >
                  <UserAvatar name={e.name} imageUrl={e.image} className="size-5" />
                  <span>{e.name}</span>
                  {selected.includes(e.id) && (
                    <span className="ml-auto text-primary text-xs">✓</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}