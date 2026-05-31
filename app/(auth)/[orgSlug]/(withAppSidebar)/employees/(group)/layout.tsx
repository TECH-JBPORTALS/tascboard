import { EmployeesShell } from '@/components/employees/employee-shell'

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <EmployeesShell>{children}</EmployeesShell>
}
