'use client'

import { usePermission } from '@/hooks/use-permission'
import type { PermissionRequest } from '@/lib/permissions'

export function NavPermissionGate({
  permissions,
  children,
}: {
  permissions: PermissionRequest
  children: React.ReactNode
}) {
  const { allowed, isLoading } = usePermission(permissions)
  if (isLoading || !allowed) return null
  return <>{children}</>
}
