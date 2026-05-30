import type { ColumnDef } from '@tanstack/react-table'

import type { DailyRow } from '@/lib/attendance-types'
import { DailyRowActions } from './daily-row-actions'

export function buildActionsColumn(
  onEdit: (row: DailyRow) => void,
): ColumnDef<DailyRow, unknown> {
  return {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const { employee, record } = row.original
      if (!record) return null
      return (
        <DailyRowActions
          record={{ ...record, employee }}
          onEdit={() => onEdit(row.original)}
        />
      )
    },
  }
}