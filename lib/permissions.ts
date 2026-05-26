import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

export const statement = {
  ...defaultStatements,
  employee: ['invite', 'list', 'read', 'update', 'remove'],
  attendance: ['read', 'manage'],
  settings: ['read', 'update'],
} as const

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  ...ownerAc.statements,
  employee: ['invite', 'list', 'read', 'update', 'remove'],
  attendance: ['read', 'manage'],
  settings: ['read', 'update'],
})

export const admin = ac.newRole({
  ...adminAc.statements,
  employee: ['invite', 'list', 'read', 'update', 'remove'],
  attendance: ['read', 'manage'],
  settings: ['read', 'update'],
})

export const employee = ac.newRole({
  ...memberAc.statements,
  employee: ['read'],
  attendance: ['read'],
  settings: ['read'],
})

export const orgRoles = {
  owner,
  admin,
  employee,
} as const

export type OrgRole = keyof typeof orgRoles

export type PermissionRequest = {
  [K in keyof typeof statement]?: (typeof statement)[K][number][]
}

export function checkRolePermission(
  role: string,
  permissions: PermissionRequest,
): boolean {
  const raw = role.split(',')[0]?.trim()
  const roleKey = (raw === 'member' ? 'employee' : raw) as OrgRole
  const roleDef = orgRoles[roleKey]
  if (!roleDef) {
    return false
  }
  return roleDef.authorize(permissions).success
}
