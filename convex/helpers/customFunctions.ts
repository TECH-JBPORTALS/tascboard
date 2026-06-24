import { ConvexError } from 'convex/values'
import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'
import { components } from '../_generated/api'
import { mutation, query } from '../_generated/server'
import { ensureActiveOrganization, ensureSession } from './auth'
import { ERROR_CODES } from './errors'

export const privateQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const session = await ensureSession(ctx)

    return { session }
  }),
)

export const privateMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const session = await ensureSession(ctx)

    const user = await ctx.runQuery(components.betterAuth.users.getById, {
      id: session.userId,
    })

    if (!user) throw new ConvexError(ERROR_CODES.BASE.USER_NOT_FOUND)

    return { session }
  }),
)

export const organizationQuery = customQuery(
  privateQuery,
  customCtx(async (ctx) => {
    const session = await ensureSession(ctx)
    const activeOrganizationId = await ensureActiveOrganization(ctx)
    const employee = await ctx.runQuery(
      components.betterAuth.employees.getByOrganizationUser,
      { organizationId: activeOrganizationId, userId: session.userId },
    )

    if (!employee)
      throw new ConvexError(ERROR_CODES.ORGANIZATION.MEMBER_NOT_FOUND)

    return { session: { ...session, activeOrganizationId, employee } }
  }),
)

export const organizationMutation = customMutation(
  privateMutation,
  customCtx(async (ctx) => {
    const session = await ensureSession(ctx)
    const activeOrganizationId = await ensureActiveOrganization(ctx)

    const employee = await ctx.runQuery(
      components.betterAuth.employees.getByOrganizationUser,
      { organizationId: activeOrganizationId, userId: session.userId },
    )

    if (!employee)
      throw new ConvexError(ERROR_CODES.ORGANIZATION.MEMBER_NOT_FOUND)

    return { session: { ...session, activeOrganizationId, employee } }
  }),
)
