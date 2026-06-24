'use client'

import {
  RiAccountCircle2Line,
  RiCheckLine,
  RiExternalLinkLine,
  RiVideoChatLine,
} from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache'
import * as React from 'react'
import { useState } from 'react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/convex/_generated/api'
import {
  getMeetingStatus,
  type MeetingStatus,
  STATUS_CONFIG,
} from '@/lib/meeting-types'
import { cn } from '@/lib/utils'

// --- Link brand helpers ---

type MeetingLinkBrand = {
  hostname: string
  label: string
  faviconUrl: string
}

const KNOWN_HOST_LABELS: Record<string, string> = {
  'meet.google.com': 'Google Meet',
  'zoom.us': 'Zoom',
  'teams.microsoft.com': 'Microsoft Teams',
  'teams.live.com': 'Microsoft Teams',
  'webex.com': 'Webex',
}

function getHostname(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

function getFriendlyLabel(hostname: string) {
  if (KNOWN_HOST_LABELS[hostname]) {
    return KNOWN_HOST_LABELS[hostname]
  }

  for (const [host, label] of Object.entries(KNOWN_HOST_LABELS)) {
    if (hostname.endsWith(`.${host}`) || hostname === host) {
      return label
    }
  }

  return hostname
}

function getMeetingLinkBrand(url: string): MeetingLinkBrand | null {
  const hostname = getHostname(url)
  if (!hostname) {
    return null
  }

  return {
    hostname,
    label: getFriendlyLabel(hostname),
    faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
  }
}

// --- Link brand UI ---

export function MeetingLinkBrandIcon({
  url,
  className,
  fallbackClassName,
}: {
  url: string
  className?: string
  fallbackClassName?: string
}) {
  const brand = getMeetingLinkBrand(url)
  const [failed, setFailed] = useState(false)

  if (!brand || failed) {
    return (
      <RiVideoChatLine
        className={cn('size-4 shrink-0', fallbackClassName, className)}
      />
    )
  }

  return (
    // biome-ignore lint/performance/noImgElement: favicon from external domain
    <img
      src={brand.faviconUrl}
      alt=""
      width={16}
      height={16}
      className={cn('size-4 shrink-0 rounded-sm object-contain', className)}
      onError={() => setFailed(true)}
    />
  )
}

export function MeetingJoinButton({
  url,
  size = 'sm',
  className,
}: {
  url: string
  size?: 'sm' | 'default'
  className?: string
}) {
  const brand = getMeetingLinkBrand(url)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-border bg-background font-medium transition-colors hover:bg-muted',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <MeetingLinkBrandIcon url={url} />
      <span>{brand?.label ?? 'Join'}</span>
      <RiExternalLinkLine className="size-3.5 text-muted-foreground" />
    </a>
  )
}

// --- Status badge ---

export function MeetingStatusBadge({
  startTime,
  endTime,
  status,
  className,
}: {
  startTime?: number
  endTime?: number
  status?: MeetingStatus
  className?: string
}) {
  const resolved =
    status ??
    (startTime !== undefined && endTime !== undefined
      ? getMeetingStatus(startTime, endTime)
      : 'upcoming')

  const config = STATUS_CONFIG[resolved]

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}

// --- Attendee picker ---

type EmployeeOption = {
  id: string
  name: string
  email: string
  image: string | null
}

export function MeetingAttendeesPicker({
  selectedIds,
  onChange,
  disabled,
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const employees = useQuery(api.employees.list)

  const selectedEmployees = React.useMemo(() => {
    if (!employees) return []
    return employees.filter((e) => selectedIds.includes(e.id))
  }, [employees, selectedIds])

  function toggleEmployee(employeeId: string) {
    if (selectedIds.includes(employeeId)) {
      onChange(selectedIds.filter((id) => id !== employeeId))
    } else {
      onChange([...selectedIds, employeeId])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-auto min-h-9 w-full justify-start gap-2 px-3 py-2 font-normal',
              selectedEmployees.length === 0 && 'text-muted-foreground',
            )}
          />
        }
      >
        {selectedEmployees.length > 0 ? (
          <span className="flex flex-wrap items-center gap-1.5">
            {selectedEmployees.map((employee) => (
              <Badge key={employee.id} variant="secondary" className="gap-1">
                <UserAvatar
                  name={employee.name}
                  imageUrl={employee.image}
                  className="size-4"
                />
                {employee.name}
              </Badge>
            ))}
          </span>
        ) : (
          <>
            <RiAccountCircle2Line className="size-4 opacity-70" />
            Select attendees
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Search employees..." />
          <CommandList>
            <CommandEmpty>No employees found</CommandEmpty>
            <CommandGroup>
              {(employees ?? []).map((employee: EmployeeOption) => {
                const selected = selectedIds.includes(employee.id)
                return (
                  <CommandItem
                    key={employee.id}
                    value={`${employee.name} ${employee.email}`}
                    onSelect={() => toggleEmployee(employee.id)}
                  >
                    <UserAvatar
                      name={employee.name}
                      imageUrl={employee.image}
                      className="size-5"
                    />
                    <span className="flex-1 truncate">{employee.name}</span>
                    {selected ? (
                      <RiCheckLine className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
