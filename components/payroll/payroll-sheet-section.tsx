import type { ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'

interface PayrollSheetSectionProps {
  children: ReactNode
  title: string
}

export function PayrollSheetSection({
  children,
  title,
}: PayrollSheetSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <Separator />
      </div>
      {children}
    </div>
  )
}

interface SheetRowProps {
  label: string
  value: string
  highlight?: boolean
}

export function SheetRow({ highlight = false, label, value }: SheetRowProps) {
  return (
    <div className="flex items-center justify-between">
      <p
        className={
          highlight ? 'text-sm font-medium' : 'text-sm text-muted-foreground'
        }
      >
        {label}
      </p>
      <p
        className={highlight ? 'text-sm font-semibold' : 'text-sm font-medium'}
      >
        {value}
      </p>
    </div>
  )
}
