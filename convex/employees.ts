import { v } from 'convex/values'
import { components } from './_generated/api'
import { query } from './_generated/server'
import { authComponent, createAuth } from './auth'
import { organizationQuery } from './lib/customFunctions'

export const list = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const employees = await auth.api.listMembers({
      headers,
    })

    return employees.members
  },
})

export const listInvitations = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const invitations = await ctx.runQuery(
      components.betterAuth.invitations.listPendingInvitations,
      {
        organizationId: ctx.session.activeOrganizationId,
      },
    )

    return invitations
  },
})

export const getEmployeeDetails = organizationQuery({
  args: { employeeId: v.string() },
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    const employee = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'employee',
      where: [
        { field: '_id', operator: 'eq', value: args.employeeId },
        { field: 'organizationId', operator: 'eq', value: orgId },
      ],
    })

    if (!employee) return null

    const member = employee as {
      _id: string
      userId: string
      role: string
      createdAt: number
      active: boolean
    }

    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
      where: [{ field: '_id', operator: 'eq', value: member.userId }],
    })

    const profile = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', member._id))
      .unique()

    const memberUser = user as {
      name?: string
      email?: string
      image?: string | null
    } | null

    return {
      id: member._id,
      userId: member.userId,
      name: memberUser?.name ?? 'Unknown',
      email: memberUser?.email ?? '',
      image: memberUser?.image ?? null,
      role: member.role,
      active: member.active,
      createdAt: member.createdAt,
      profile: profile
        ? {
            firstName: profile.firstName ?? null,
            lastName: profile.lastName ?? null,
            dateOfBirth: profile.dateOfBirth ?? null,
            address: profile.address ?? null,
            aadharNumber: profile.aadharNumber ?? null,
            panNumber: profile.panNumber ?? null,
            bankAccountNumber: profile.bankAccountNumber ?? null,
            bankName: profile.bankName ?? null,
            ifscCode: profile.ifscCode ?? null,
            branchName: profile.branchName ?? null,
            onboardingStatus: profile.onboardingStatus,
            onboardingStep: profile.onboardingStep,
          }
        : null,
    }
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
