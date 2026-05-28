import { GenericCtx } from '@convex-dev/better-auth'
import {
  customMutation,
  customQuery,
} from 'convex-helpers/server/customFunctions'
import { DataModel } from '../_generated/dataModel'
import { mutation, query } from '../_generated/server'
import { authComponent, createAuth } from '../auth'

async function validateSession(ctx: GenericCtx<DataModel>) {
  const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
  const authSession = await auth.api.getSession({ headers })
  if (!authSession) throw new Error('Unauthorized')
  return { ...authSession.session, user: authSession.user }
}

/** Private Query will validate the session and returns BetterAuth session object */
export const privateQuery = customQuery(query, {
  args: {},
  input: async (ctx, args) => {
    const session = await validateSession(ctx)
    return { ctx: { ...ctx, session }, args }
  },
})

/** Private Mutation will validate the session and returns BetterAuth session object */
export const privateMutation = customMutation(mutation, {
  args: {},
  input: async (ctx, args) => {
    const session = await validateSession(ctx)
    return { ctx: { ...ctx, session }, args }
  },
})

/** Organization Query will validate the session and returns BetterAuth session object with the active organization id */
export const organizationQuery = customQuery(privateQuery, {
  args: {},
  input: async (ctx, args, extra) => {
    const session = await validateSession(ctx)
    if (!session.activeOrganizationId) throw new Error('No active organization')

    return {
      ctx: {
        ...ctx,
        session: {
          ...session,
          activeOrganizationId: session.activeOrganizationId,
        },
      },
      args,
    }
  },
})

/** Organization Mutation will validate the session and returns BetterAuth session object with the active organization id */
export const organizationMutation = customMutation(privateMutation, {
  args: {},
  input: async (ctx, args) => {
    const session = await validateSession(ctx)
    if (!session.activeOrganizationId) throw new Error('No active organization')
    return {
      ctx: {
        ...ctx,
        session: {
          ...session,
          activeOrganizationId: session.activeOrganizationId,
        },
      },
      args,
    }
  },
})
