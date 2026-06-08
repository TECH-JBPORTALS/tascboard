'use client'

import { RiUserLine } from '@remixicon/react'
import { UserAvatar } from '@/components/employees/user-avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface Recipient {
  employeeId: string
}

interface EmpInfo {
  name: string
  image: string | null
  role?: string
}

interface Props {
  recipients: Recipient[] | undefined
  empMap: Map<string, EmpInfo>
}

export function MeetingDetailAttendees({ recipients, empMap }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <RiUserLine className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Attendees</h2>
      </div>

      {recipients === undefined ? (
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-lg" />
          ))}
        </div>
      ) : recipients.length === 0 ? (
        <p className="text-xs text-muted-foreground">No attendees added.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {recipients.map((r) => {
            const e = empMap.get(r.employeeId)
            return (
              <div
                key={r.employeeId}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5"
              >
                <UserAvatar
                  name={e?.name ?? '?'}
                  imageUrl={e?.image}
                  className="size-5"
                />
                <span className="text-xs font-medium">
                  {e?.name ?? r.employeeId}
                </span>
                {e?.role && (
                  <span className="text-xs text-muted-foreground">
                    {e.role}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
