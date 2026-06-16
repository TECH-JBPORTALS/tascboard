'use client'

import { Protect } from '@/components/auth/protect'
import { EmployeeYearlyPayroll } from '@/components/payroll/employee-yearly-payroll'
import { OwnerMonthlyPayroll } from '@/components/payroll/owner-monthly-payroll'
import { PayrollHeader } from '@/components/payroll/payroll-header'
import { usePermission } from '@/hooks/use-permission'

function PayrollContent() {
  const { allowed: isOwner, isReady } = usePermission({ payroll: ['manage'] })

  if (!isReady) return null
  if (isOwner) return <OwnerMonthlyPayroll />
  return <EmployeeYearlyPayroll />
}

export default function PayrollPage() {
  return (
    <div>
      <PayrollHeader />
      <Protect permissions={{ payroll: ['read'] }}>
        <PayrollContent />
      </Protect>
    </div>
  )
}
