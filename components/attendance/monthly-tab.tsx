'use client'

import { RiDownloadLine } from '@remixicon/react'
import { addMonths, subMonths } from 'date-fns'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { MOCK_MONTHLY } from './mock-data'
import { MonthlyNav } from './monthly-nav'
import { MonthlyStats } from './monthly-stats'
import { MonthlyTable } from './monthly-table'

export function MonthlyTab() {
  const [month, setMonth] = useState<Date>(new Date())

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex items-center justify-between">
        <MonthlyNav
          month={month}
          onPrev={() => setMonth((m) => subMonths(m, 1))}
          onNext={() => setMonth((m) => addMonths(m, 1))}
        />
        <Button variant="outline" size="sm">
          <RiDownloadLine />
          Export
        </Button>
      </div>
      <MonthlyStats records={MOCK_MONTHLY} />
      <MonthlyTable records={MOCK_MONTHLY} />
    </div>
  )
}
