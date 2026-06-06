'use client'

import { RiAccountCircle2Line, RiCheckLine } from '@remixicon/react'
import { useQuery } from 'convex/react'
import * as React from 'react'
import { UserAvatar } from '@/components/employees/user-avatar'
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
import { cn } from '@/lib/utils'

type Props = {
  selected: string[]
  onToggle: (id: string) => void
}

export function MeetingAttendeePicker({ selected, onToggle }: Props) {
  const [open, setOpen] = React.useState(false)
  const raw = useQuery(api.employees.list)

  const employees = React.useMemo(
    () =>
      (raw ?? []).map((e) => ({
        id: e.id,
        name: e.user?.name ?? e.user?.email ?? 'Unknown',
        image: e.user?.image ?? null,
      })),
    [raw],
  )

  const selectedList = employees.filter((e) => selected.includes(e.id))
  const unselectedList = employees.filter((e) => !selected.includes(e.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type='button'
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/30',
              open && 'border-ring',
            )}
          />
        }
      >
        {selectedList.length > 0 ? (
          <>
            <span className='flex -space-x-1.5'>
              {selectedList.slice(0, 5).map((e) => (
                <UserAvatar
                  key={e.id}
                  name={e.name}
                  imageUrl={e.image}
                  className='size-5'
                />
              ))}
            </span>
            <span className='text-xs text-foreground'>
              {selectedList.length}{' '}
              {selectedList.length === 1 ? 'attendee' : 'attendees'}
            </span>
          </>
        ) : (
          <>
            <RiAccountCircle2Line className='size-4 opacity-70' />
            <span>Select attendees...</span>
          </>
        )}
      </PopoverTrigger>
      <PopoverContent side='right' align='start' sideOffset={8} className='w-56 p-0'>
        <Command>
          <CommandList>
            <CommandInput placeholder='Set member...' />
            <CommandEmpty>No members found</CommandEmpty>
            {selectedList.length > 0 && (
              <CommandGroup heading='Selected'>
                {selectedList.map((e) => (
                  <CommandItem
                    key={e.id}
                    value={e.name}
                    onSelect={() => onToggle(e.id)}
                  >
                    <UserAvatar name={e.name} imageUrl={e.image} className='size-5' />
                    <span className='flex-1 truncate'>{e.name}</span>
                    <RiCheckLine className='ml-auto size-3.5 text-primary' />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading='Organization members'>
              {unselectedList.map((e) => (
                <CommandItem
                  key={e.id}
                  value={e.name}
                  onSelect={() => onToggle(e.id)}
                >
                  <UserAvatar name={e.name} imageUrl={e.image} className='size-5' />
                  <span className='flex-1 truncate'>{e.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}