import { createAccessControl } from 'better-auth/plugins/access'
import {
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

export const statement = {
  ...defaultStatements,
  project: ['create', 'read', 'update', 'delete'],
  attendance: ['create', 'personal', 'read', 'delete', 'edit'],
  payroll: ['read', 'manage', 'personal'],
} as const

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  ...ownerAc.statements,
  project: ['create', 'read', 'update', 'delete'],
  attendance: ['create', 'read', 'delete', 'edit'],
  payroll: ['read', 'manage'],
})

export const employee = ac.newRole({
  ...memberAc.statements,
  project: ['read'],
  attendance: ['personal', 'read'],
  payroll: ['read', 'personal'],
})

export const orgRoles = {
  owner,
  employee,
} as const

export type OrgRole = keyof typeof orgRoles

export type PermissionRequest = {
  [K in keyof typeof statement]?: (typeof statement)[K][number][]
}
