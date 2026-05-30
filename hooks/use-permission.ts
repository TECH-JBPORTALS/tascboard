'use client'

import { useOrganizationAccess } from '@/components/organization/organization-access-provider'
import { checkRolePermission } from '@/lib/auth-client'
import type { PermissionRequest } from '@/lib/permissions'

export function useOrgRole() {
  return useOrganizationAccess()
}

export function usePermission(permissions: PermissionRequest) {
  const { role, isReady } = useOrganizationAccess()

  const allowed =
    isReady && role !== null ? checkRolePermission(role, permissions) : false

  return { allowed, role, isReady }
}
