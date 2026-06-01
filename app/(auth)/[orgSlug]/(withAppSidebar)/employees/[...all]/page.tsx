'use client'

import { useParams } from 'next/navigation'
import { BackToEmployeeButton } from '@/components/employees/back-to-employee-button'
import { EmployeeBankSettingsPage } from '@/components/employees/employee-bank-settings-page'
import { EmployeeGeneralSettingsPage } from '@/components/employees/employee-general-settings-page'
import { EmployeeSettingsHubPage } from '@/components/employees/employee-settings-hub-page'

export default function EmployeeSettingsRoutePage() {
  const params = useParams<{ all: string[] }>()
  const [employeeId, ...segments] = params.all
  const subPage = segments[0]

  if (subPage === 'general') {
    return (
      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
        <BackToEmployeeButton employeeId={employeeId} />
        <EmployeeGeneralSettingsPage employeeId={employeeId} />
      </div>
    )
  }

  if (subPage === 'bank-details') {
    return (
      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
        <BackToEmployeeButton employeeId={employeeId} />
        <EmployeeBankSettingsPage employeeId={employeeId} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
      <EmployeeSettingsHubPage employeeId={employeeId} />
    </div>
  )
}
