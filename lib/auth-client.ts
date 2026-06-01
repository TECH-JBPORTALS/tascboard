import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import {
  ac,
  employee,
  OrgRole,
  owner,
  PermissionRequest,
} from '@/lib/permissions'

export const authClient = createAuthClient({
  plugins: [
    convexClient(),
    organizationClient({
      ac,
      roles: { owner, employee },
    }),
  ],
})

export function checkRolePermission(
  role: OrgRole,
  permissions: PermissionRequest,
): boolean {
  const hasAccess = authClient.organization.checkRolePermission({
    permissions,
    role,
  })
  return hasAccess
}
