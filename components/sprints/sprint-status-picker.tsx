'use client'

import * as React from 'react'
import { SprintStatusPickerCommand } from '@/components/sprints/commands/sprint-status-picker.command'
import { type SprintStatus, sprintStatusConfig } from '@/lib/track-utils'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

type SprintStatusPickerProps = {
  value: SprintStatus
  trigger: React.ReactElement
  onSelect: (status: SprintStatus) => void
  className?: string
  placeholder?: string
}

export function SprintStatusPicker({
  value,
  trigger,
  onSelect,
  className,
  placeholder = 'Change status…',
}: SprintStatusPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (status: SprintStatus) => {
    onSelect(status)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className={cn('w-56 p-0', className)}
        align="start"
        sideOffset={4}
      >
        <SprintStatusPickerCommand
          value={value}
          onSelect={handleSelect}
          placeholder={placeholder}
        />
      </PopoverContent>
    </Popover>
  )
}

type SprintStatusIconProps = {
  status: SprintStatus
  className?: string
}

export function SprintStatusIcon({ status, className }: SprintStatusIconProps) {
  const config = sprintStatusConfig[status]
  const Icon = config.icon

  return (
    <Icon className={cn('size-4 shrink-0', config.iconClassName, className)} />
  )
}
