import { EmployeesShell } from '@/components/employees/EmployeesShell'

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <EmployeesShell>{children}</EmployeesShell>
}
