'use client'

import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarLine,
} from '@remixicon/react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'

interface MonthlyNavProps {
  month: Date
  onPrev: () => void
  onNext: () => void
}

export function MonthlyNav({ month, onPrev, onNext }: MonthlyNavProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" onClick={onPrev}>
        <RiArrowLeftSLine />
      </Button>
      <Button variant="outline" size="sm" className="gap-1.5 px-3">
        <RiCalendarLine />
        {format(month, 'MMMM yyyy')}
      </Button>
      <Button variant="outline" size="icon" onClick={onNext}>
        <RiArrowRightSLine />
      </Button>
    </div>
  )
}
