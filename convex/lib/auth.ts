import { GenericCtx } from '@convex-dev/better-auth'
import { UserIdentity } from 'convex/server'
import { DataModel } from '../_generated/dataModel'
import { getEmployeeForUser } from './employees'
import { checkRolePermission, type PermissionRequest } from './permissions'

type AppUserIdentity = UserIdentity & {
  userId: string
  sessionId: string
  orgId?: string | null
  email?: string | null
}

export async function requireIdentity(ctx: GenericCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) throw new Error('Unauthorised access!')

  return identity as AppUserIdentity
}

export async function getOrganizationContext(ctx: GenericCtx<DataModel>) {
  const identity = await requireIdentity(ctx)

  if (!identity.orgId) return null

  return { orgId: identity.orgId as string, userId: identity.userId }
}

export async function requireOrganization(ctx: GenericCtx<DataModel>) {
  const context = await getOrganizationContext(ctx)

  if (!context) throw new Error('Unauthorised access!')

  return context
}

export async function requireMembership(ctx: GenericCtx<DataModel>) {
  const { orgId, userId } = await requireOrganization(ctx)
  const employee = await getEmployeeForUser(ctx, orgId, userId)

  if (!employee) {
    throw new Error('You are not an employee of this organization.')
  }

  return { orgId, userId, employee }
}

export async function requirePermission(
  ctx: GenericCtx<DataModel>,
  permissions: PermissionRequest,
) {
  const { orgId, userId, employee } = await requireMembership(ctx)

  if (!checkRolePermission(employee.role, permissions)) {
    throw new Error('You do not have permission to perform this action.')
  }

  return { orgId, userId, employee }
}
