'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { MonthlyRecord } from '@/lib/attendance-types'

interface MonthlyStatsProps {
  records: MonthlyRecord[]
}

export function MonthlyStats({ records }: MonthlyStatsProps) {
  const totalPresent = records.reduce((s, r) => s + r.totalPresent, 0)
  const totalLate = records.reduce((s, r) => s + r.totalLate, 0)
  const totalLeaves = records.reduce((s, r) => s + r.totalLeaves, 0)

  const stats = [
    { label: 'Total Present Days', value: totalPresent },
    { label: 'Total Late Days', value: totalLate },
    { label: 'Total Leave Days', value: totalLeaves },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <Card key={s.label} size="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
