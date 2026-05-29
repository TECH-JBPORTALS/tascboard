'use client'

import * as React from 'react'
import { TaskCommandPopover } from '@/components/tasks/task-command-popover'
import {
  type SprintStatus,
  sprintStatusConfig,
  sprintStatusOrder,
} from '@/lib/track-utils'
import { cn } from '@/lib/utils'

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

  const options = sprintStatusOrder.map((status) => {
    const config = sprintStatusConfig[status]
    return {
      value: status,
      label: config.label,
      shortcut: config.shortcut,
      icon: <SprintStatusIcon status={status} className="size-3.5" />,
    }
  })

  return (
    <TaskCommandPopover
      open={open}
      onOpenChange={setOpen}
      trigger={trigger}
      placeholder={placeholder}
      shortcutKey="S"
      options={options}
      value={value}
      onSelect={onSelect}
      className={className}
    />
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
