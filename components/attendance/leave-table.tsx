'use client'

import { DataTable } from '@/components/data-table'
import type { EnrichedLeave } from '@/lib/attendance-types'
import { leaveColumns } from './leave-columns'

type Props = { records: EnrichedLeave[] }

export function LeaveTable({ records }: Props) {
  return (
    <div className='p-4 md:p-6'>
      <DataTable columns={leaveColumns} data={records} />
    </div>
  )
}