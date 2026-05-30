'use client'

import {
  RiDeleteBinLine,
  RiDownloadLine,
  RiMoreLine,
  RiPencilLine,
} from '@remixicon/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PayrollRecord } from '@/lib/payroll-types'

interface PayrollRowActionsProps {
  onDelete: (id: string) => void
  onDownload: (record: PayrollRecord) => void
  onEdit: (record: PayrollRecord) => void
  record: PayrollRecord
}

export function PayrollRowActions({
  onDelete,
  onDownload,
  onEdit,
  record,
}: PayrollRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon">
            <RiMoreLine />
            <span className="sr-only">Open actions</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(record)}>
          <RiPencilLine />
          View / Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload(record)}>
          <RiDownloadLine />
          Download Payslip
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onDelete(record.id)}
        >
          <RiDeleteBinLine />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
