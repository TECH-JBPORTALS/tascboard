'use client'

import { usePermission } from '@/hooks/use-permission'
import type { PermissionRequest } from '@/lib/permissions'

export function Protect({
  permissions,
  children,
  fallback = null,
}: {
  permissions: PermissionRequest
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { allowed, isReady } = usePermission(permissions)

  if (!isReady || !allowed) return <>{fallback}</>

  return <>{children}</>
}
