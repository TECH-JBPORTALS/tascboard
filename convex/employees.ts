import { v } from 'convex/values'
import { query } from './_generated/server'
import { authComponent, createAuth } from './auth'
import { organizationQuery } from './lib/customFunctions'

export const listEmployees = organizationQuery({
  args: {},
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const employees = await auth.api.listMembers({
      headers,
      query: {
        filterField: 'role',
        filterOperator: 'eq',
        filterValue: 'employee',
      },
    })

    return employees.members
  },
})

export const getInvitationById = query({
  args: { invitationId: v.string() },
  handler: async (ctx, args: { invitationId: string }) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    const invitation = await auth.api.getInvitation({
      headers,
      query: { id: args.invitationId },
    })

    const session = await auth.api.getSession({ headers })

    return {
      ...invitation,
      user: session?.user,
    }
  },
})
