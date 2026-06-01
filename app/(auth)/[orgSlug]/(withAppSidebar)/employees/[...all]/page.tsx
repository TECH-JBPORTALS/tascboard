'use client'

import { useParams } from 'next/navigation'
import { EmployeeDetailsPage } from '@/components/employees/employee-details-page'

export default function EmployeeDetailsTabPage() {
  const params = useParams<{ all: string[] }>()
  const [employeeId, ...tab] = params.all

  return <EmployeeDetailsPage employeeId={employeeId} tabSegments={tab} />
}
