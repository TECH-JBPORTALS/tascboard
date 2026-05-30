import { useState } from 'react'
import type { ActiveTab } from '@/lib/attendance-types'

export function useAttendanceState() {
  const now = new Date()
  const [activeTab, setActiveTab] = useState<ActiveTab>('daily')
  const [date, setDate] = useState(now)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const prevDay = () =>
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  const nextDay = () =>
    setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  return {
    activeTab, setActiveTab,
    date, prevDay, nextDay,
    year, month, prevMonth, nextMonth,
  }
}