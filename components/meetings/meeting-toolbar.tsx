'use client'

import { RiSearchLine } from '@remixicon/react'
import { Input } from '../ui/input'

interface MeetingToolbarProps {
  search: string
  onSearchChange: (value: string) => void
}

export function MeetingToolbar({
  search,
  onSearchChange,
}: MeetingToolbarProps) {
  return (
    <div className="flex items-center border-b border-border bg-accent/40 px-4 py-2">
      <div className="relative w-56">
        <RiSearchLine className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 border-0 bg-transparent pl-8 text-sm shadow-none focus-visible:ring-0"
          placeholder="Search meetings..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  )
}
