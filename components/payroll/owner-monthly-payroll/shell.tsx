'use client'

import {
  RiCalendar2Line,
  RiDownloadLine,
  RiSearch2Line,
} from '@remixicon/react'
import { format, startOfMonth } from 'date-fns'
import { parseAsIsoDate, useQueryState } from 'nuqs'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export function OwnerMonthlyPayrollShell({
  children,
  onGenerate,
  onExport,
  generating,
}: {
  children: React.ReactNode
  onGenerate: () => void
  onExport: () => void
  generating: boolean
}) {
  const [selectedDate, setSelectedDate] = useQueryState(
    'date',
    parseAsIsoDate
      .withDefault(new Date())
      .withOptions({ clearOnDefault: true }),
  )
  const [search, setSearch] = useQueryState('q', {
    defaultValue: '',
    clearOnDefault: true,
  })

  return (
    <div className="space-y-4 px-6 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup className="h-8 max-w-sm">
          <InputGroupAddon>
            <RiSearch2Line />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={onExport}>
            <RiDownloadLine />
            Export CSV
          </Button>
          <Button onClick={onGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate for month'}
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button size="lg" variant="outline">
                  <RiCalendar2Line className="text-muted-foreground" />
                  {format(selectedDate, 'MMMM yyyy')}
                </Button>
              }
            />
            <PopoverContent className="w-fit p-0">
              <Calendar
                required
                mode="single"
                defaultMonth={selectedDate}
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(startOfMonth(date))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {children}
    </div>
  )
}
