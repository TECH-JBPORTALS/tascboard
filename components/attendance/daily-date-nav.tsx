'use client'

import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'

type Props = {
  date: Date
  onPrev: () => void
  onNext: () => void
}

export function DailyDateNav({ date, onPrev, onNext }: Props) {
  const isToday = date.toDateString() === new Date().toDateString()

  const label = isToday
    ? 'Today'
    : date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onPrev}>
        <RiArrowLeftSLine className="size-4" />
      </Button>
      <span className="min-w-40 text-center text-sm font-medium">{label}</span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={isToday}>
        <RiArrowRightSLine className="size-4" />
      </Button>
    </div>
  )
}
