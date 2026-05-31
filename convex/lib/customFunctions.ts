import { GenericCtx } from '@convex-dev/better-auth'
import {
  customCtx,
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'
import { DataModel } from '../_generated/dataModel'
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from '../_generated/server'
import { authComponent, createAuth } from '../auth'

export async function validateSession(ctx: GenericCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Unauthorized')

  const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

  const session = await auth.api.getSession({ headers })

  if (!session) throw new Error('User not found')

  return {
    ...session.session,
    user: session.user,
  }
}

export async function validateActiveOrganization(ctx: GenericCtx<DataModel>) {
  const session = await validateSession(ctx)

  if (!session.activeOrganizationId) throw new Error('No active organization')
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

  const member = await auth.api.getActiveMember({ headers })
  if (!member) throw new Error('User not a member of the organization')

  return {
    ...session,
    activeOrganizationId: session.activeOrganizationId,
    /** Just kept the name same in all entities - but deep down it's betterAuth's member there nothing betrayed here.
     * If you curios how table name is stored look in the convex/betterAuth/schema.ts file.
     */
    employee: member,
  }
}

export const privateQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const session = await validateSession(ctx)

    return { ...ctx, session }
  }),
)

export const privateMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const session = await validateSession(ctx)
    return { ...ctx, session }
  }),
)

export const privateInternalQuery = customQuery(
  internalQuery,
  customCtx(async (ctx) => {
    const session = await validateSession(ctx)
    return { ...ctx, session }
  }),
)

export const privateInternalMutation = customMutation(
  internalMutation,
  customCtx(async (ctx) => {
    const session = await validateSession(ctx)
    return { ...ctx, session }
  }),
)

export const organizationQuery = customQuery(
  privateQuery,
  customCtx(async (ctx) => {
    const session = await validateActiveOrganization(ctx)
    return { ...ctx, session }
  }),
)

export const organizationMutation = customMutation(
  privateMutation,
  customCtx(async (ctx) => {
    const session = await validateActiveOrganization(ctx)
    return { ...ctx, session }
  }),
)

export const organizationInternalQuery = customQuery(
  privateQuery,
  customCtx(async (ctx) => {
    const session = await validateActiveOrganization(ctx)
    return { ...ctx, session }
  }),
)

export const organizationInternalMutation = customMutation(
  privateInternalMutation,
  customCtx(async (ctx) => {
    const session = await validateActiveOrganization(ctx)
    return { ...ctx, session }
  }),
)
