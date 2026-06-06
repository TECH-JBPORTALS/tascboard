'use client'

import {
  RiArrowDownSLine,
  RiSearchLine,
} from '@remixicon/react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

type Props = {
  onAdd: () => void
  onExport: () => void
  onMonthChange: (month: number | null) => void
  onYearChange: (year: number) => void
  onSearchChange: (q: string) => void
  search: string
  selectedMonth: number | null
  selectedYear: number
}

export function PayrollToolbar({
  onMonthChange,
  onYearChange,
  onSearchChange,
  search,
  selectedMonth,
  selectedYear,
}: Props) {
  const monthLabel = selectedMonth
    ? format(new Date(2024, selectedMonth - 1), 'MMMM')
    : 'All Months'

  return (
    <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3 md:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm">
              {selectedYear} <RiArrowDownSLine />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {YEARS.map((y) => (
            <DropdownMenuItem key={y} onClick={() => onYearChange(y)}>
              {y}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm">
              {monthLabel} <RiArrowDownSLine />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onMonthChange(null)}>
            All Months
          </DropdownMenuItem>
          {MONTHS.map((m) => (
            <DropdownMenuItem key={m} onClick={() => onMonthChange(m)}>
              {format(new Date(2024, m - 1), 'MMMM')}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="relative">
        <RiSearchLine className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employee…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-44 pl-8 text-sm"
        />
      </div>
    </div>
  )
}