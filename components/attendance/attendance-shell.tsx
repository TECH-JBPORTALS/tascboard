'use client'

import { RiCalendarCheckLine } from '@remixicon/react'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ActiveTab } from '@/lib/attendance-types'

const TABS: { label: string; value: ActiveTab }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Leave Requests', value: 'leave' },
]

type Props = {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  actions?: React.ReactNode
  children: React.ReactNode
}

export function AttendanceShell({
  activeTab,
  onTabChange,
  actions,
  children,
}: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        icon={<RiCalendarCheckLine />}
        title="Attendance"
        actions={actions}
      />
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as ActiveTab)}
        className="w-full border-b bg-accent/40"
      >
        <TabsList variant="line">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {children}
    </div>
  )
}
