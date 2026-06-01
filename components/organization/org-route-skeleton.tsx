'use client'

import { RiTBoxLine } from "@remixicon/react"

export function OrganizationRouteSkeleton() {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-3 p-6">
      <RiTBoxLine
       className="size-16 text-primary dark:text-muted-foreground" />
      <div className="flex">
        <span className="text-muted-foreground text-sm">
          Loading workspace...
        </span>
        <span className="animate-caret-blink h-4 mx-1 w-1 bg-primary dark:bg-foreground" />
      </div>
    </div>
  )
}
