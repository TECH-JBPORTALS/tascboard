import { RiCalendarLine } from '@remixicon/react'

export function MeetingEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
      <RiCalendarLine className="size-8 text-muted-foreground/50" />
      <p className="text-sm font-medium">No meetings yet</p>
      <p className="text-xs text-muted-foreground">
        Schedule a meeting to get started.
      </p>
    </div>
  )
}