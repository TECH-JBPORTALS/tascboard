'use client'

import { RiMoneyDollarCircleLine } from '@remixicon/react'
import { PageHeader } from '../ui/page-header'

export function PayrollHeader() {
  return (
    <PageHeader icon={<RiMoneyDollarCircleLine />} title="Payroll" />
  )
}
