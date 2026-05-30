'use client'

import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'

type Props = {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
}

export function MonthlyNav({ year, month, onPrev, onNext }: Props) {
  const now = new Date()
  const isCurrent = year === now.getFullYear() && month === now.getMonth()

  const label = new Date(year, month, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onPrev}>
        <RiArrowLeftSLine className="size-4" />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium">{label}</span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={isCurrent}>
        <RiArrowRightSLine className="size-4" />
      </Button>
    </div>
  )
}
