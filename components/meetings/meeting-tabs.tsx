'use client'

import type { DetailTab } from './use-meeting-state'

const TABS: { label: string; value: DetailTab }[] = [
  { label: 'Overview', value: 'overview' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Completed', value: 'completed' },
]

type Props = {
  active: DetailTab
  onChange: (tab: DetailTab) => void
}

export function MeetingTabs({ active, onChange }: Props) {
  return (
    <div className='flex items-center gap-0 border-b'>
      {TABS.map((t) => (
        <button
          key={t.value}
          type='button'
          onClick={() => onChange(t.value)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            active === t.value
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}