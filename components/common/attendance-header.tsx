'use client'

import { RiCalendarCheckLine } from '@remixicon/react'
import { useQuery } from 'convex-helpers/react/cache'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { usePermission } from '@/hooks/use-permission'
import { Badge } from '../ui/badge'
import { PageHeader } from '../ui/page-header'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'

const tabs = [
  {
    id: 1,
    label: 'Daily',
    href: '',
  },
  {
    id: 2,
    label: 'Monthly',
    href: '/monthly',
  },
  {
    id: 3,
    label: 'Leave Requests',
    href: '/leave-requests',
  },
]

function resolveActiveTab(pathname: string, basePath: string) {
  if (pathname.startsWith(`${basePath}/leave-requests`)) {
    return `${basePath}/leave-requests`
  }
  if (pathname.startsWith(`${basePath}/monthly`)) {
    return `${basePath}/monthly`
  }
  if (pathname === basePath || pathname.startsWith(`${basePath}?`)) {
    return basePath
  }
  return pathname
}

export function AttendanceHeader() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const basePath = `/${orgSlug}/attendance`
  const pathname = usePathname()
  const { allowed: isOwner } = usePermission({
    attendance: ['delete', 'edit'],
  })
  const pendingCount = useQuery(
    api.leaveRequest.pendingCount,
    isOwner ? {} : 'skip',
  )

  return (
    <PageHeader
      icon={<RiCalendarCheckLine />}
      title="Attendance"
      actions={
        <Tabs value={resolveActiveTab(pathname, basePath)}>
          <TabsList>
            {tabs
              .filter((tab) => isOwner || tab.href !== '/monthly')
              .map((tab) => {
                const href = `${basePath}${tab.href}`
                const showBadge =
                  tab.href === '/leave-requests' &&
                  isOwner &&
                  typeof pendingCount === 'number' &&
                  pendingCount > 0

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={href}
                    nativeButton={false}
                    render={<Link href={href} />}
                  >
                    {tab.label}
                    {showBadge ? (
                      <Badge className="ml-1 bg-primary/15 px-1.5 text-primary">
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </Badge>
                    ) : null}
                  </TabsTrigger>
                )
              })}
          </TabsList>
        </Tabs>
      }
    />
  )
}
