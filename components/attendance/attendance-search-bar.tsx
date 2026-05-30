'use client'

import { RiSearchLine } from '@remixicon/react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AttendanceStatus } from '@/lib/attendance-types'

type Props = {
  searchTerm: string
  onSearch: (v: string) => void
  statusFilter?: AttendanceStatus | 'all'
  onStatusFilter?: (v: AttendanceStatus | 'all') => void
}

export function AttendanceSearchBar({
  searchTerm,
  onSearch,
  statusFilter,
  onStatusFilter,
}: Props) {
  return (
    <div className='flex items-center gap-2'>
      <div className='relative'>
        <RiSearchLine className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder='Search employee...'
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className='w-44 pl-8'
        />
      </div>
      {onStatusFilter ? (
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilter((v ?? 'all') as AttendanceStatus | 'all')}
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='All Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='present'>Present</SelectItem>
            <SelectItem value='late'>Late</SelectItem>
            <SelectItem value='on leave'>On Leave</SelectItem>
            <SelectItem value='half day'>Half Day</SelectItem>
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}