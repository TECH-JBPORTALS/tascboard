'use client'

import { RiCalendarCheckLine } from '@remixicon/react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
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
]

export function AttendanceHeader() {
  const { orgSlug } = useParams<{ orgSlug: string }>()
  const basePath = `/${orgSlug}/attendance`
  const pathname = usePathname()

  return (
    <PageHeader
      icon={<RiCalendarCheckLine />}
      title="Attendance"
      actions={
        <Tabs value={pathname}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={`${basePath}${tab.href}`}
                nativeButton={false}
                render={<Link href={`${basePath}${tab.href}`} />}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      }
    />
  )
}
