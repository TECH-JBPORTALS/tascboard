import type { GenericCtx } from '@convex-dev/better-auth'
import { ConvexError } from 'convex/values'
import { components } from '../_generated/api'
import type { DataModel } from '../_generated/dataModel'
import { ERROR_CODES } from './errors'

/**
 * Helper function to validate the sessionId exists convex identitiy and
 * @returns `session`
 *
 */
export const ensureSession = async (ctx: GenericCtx<DataModel>) => {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity?.sessionId)
    throw new ConvexError(ERROR_CODES.BASE.UNAUTHORIZED.message)

  const user = await ctx.runQuery(components.betterAuth.users.getById, {
    id: identity.subject,
  })

  if (!user) throw new ConvexError(ERROR_CODES.BASE.USER_NOT_FOUND)

  return {
    id: identity.sessionId,
    userId: identity.subject,
    user,
  }
}

/**
 * Helper function to validate the `activeOrganizationId` exists in the convex identity and
 * @returns `activeOrganizationId`
 */
export const ensureActiveOrganization = async (ctx: GenericCtx<DataModel>) => {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) throw new ConvexError(ERROR_CODES.BASE.UNAUTHORIZED.message)

  if (!identity.activeOrganizationId)
    throw new ConvexError(
      ERROR_CODES.ORGANIZATION.NO_ACTIVE_ORGANIZATION.message,
    )

  return identity.activeOrganizationId
}
