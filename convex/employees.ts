import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { query } from './_generated/server'
import { authComponent, createAuth } from './auth'
import { organizationMutation, organizationQuery } from './lib/customFunctions'
import { getActiveEmployeeId, isOrgOwner } from './lib/memberHelper'

const employeeProfileReturn = v.union(
  v.object({
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    dateOfBirth: v.union(v.string(), v.null()),
    address: v.union(v.string(), v.null()),
    aadharNumber: v.union(v.string(), v.null()),
    panNumber: v.union(v.string(), v.null()),
    bankAccountNumber: v.union(v.string(), v.null()),
    bankName: v.union(v.string(), v.null()),
    ifscCode: v.union(v.string(), v.null()),
    branchName: v.union(v.string(), v.null()),
    onboardingStatus: v.union(v.literal('pending'), v.literal('completed')),
    onboardingStep: v.number(),
  }),
  v.null(),
)

const employeeDetailsReturn = v.union(
  v.object({
    id: v.string(),
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.union(v.string(), v.null()),
    profilePhotoUrl: v.union(v.string(), v.null()),
    role: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    profile: employeeProfileReturn,
  }),
  v.null(),
)

const invitationUserReturn = v.union(
  v.object({
    id: v.string(),
    email: v.string(),
    name: v.string(),
    image: v.union(v.string(), v.null()),
    emailVerified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  v.null(),
)

const invitationReturn = v.union(
  v.object({
    id: v.string(),
    email: v.string(),
    organizationId: v.string(),
    organizationName: v.string(),
    organizationSlug: v.string(),
    role: v.union(v.string(), v.null()),
    status: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    inviterId: v.string(),
    user: invitationUserReturn,
  }),
  v.null(),
)

function requireOrgOwner(session: { employee: unknown }) {
  if (!isOrgOwner(session)) {
    throw new Error('Only organization owners can manage employees.')
  }
}

async function getOrCreateProfileForEmployee(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  employeeId: string,
): Promise<Doc<'employeeProfiles'>> {
  const existing = await ctx.db
    .query('employeeProfiles')
    .withIndex('by_employee', (q) => q.eq('employeeId', employeeId))
    .unique()

  if (existing) return existing

  const id = await ctx.db.insert('employeeProfiles', {
    employeeId,
    onboardingStatus: 'pending',
    onboardingStep: 0,
  })

  const created = await ctx.db.get(id)
  if (!created) throw new Error('Failed to create employee profile.')
  return created
}

async function getEmployeeInOrganization(
  ctx: { runQuery: import('./_generated/server').MutationCtx['runQuery'] },
  organizationId: string,
  employeeId: string,
) {
  return await ctx.runQuery(components.betterAuth.employees.getInOrganization, {
    employeeId,
    organizationId,
  })
}

function sessionUserFromAuth(session: {
  user: {
    id: string
    email: string
    name: string
    image?: string | null
    emailVerified: boolean
    createdAt: Date | number
    updatedAt: Date | number
  }
}) {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
    emailVerified: session.user.emailVerified,
    createdAt:
      session.user.createdAt instanceof Date
        ? session.user.createdAt.getTime()
        : Number(session.user.createdAt),
    updatedAt:
      session.user.updatedAt instanceof Date
        ? session.user.updatedAt.getTime()
        : Number(session.user.updatedAt),
  }
}

export const list = organizationQuery({
  args: {},
  handler: async (ctx) => {
    const { activeOrganizationId } = ctx.session
    const employees = await ctx.runQuery(components.betterAuth.employees.list, {
      organizationId: activeOrganizationId,
    })

    return employees
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
  returns: employeeDetailsReturn,
  handler: async (ctx, args) => {
    const { activeOrganizationId: orgId } = ctx.session
    const employee = await getEmployeeInOrganization(ctx, orgId, args.employeeId)

    if (!employee) return null

    const profile = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee._id))
      .unique()

    const user = await ctx.runQuery(
      components.betterAuth.employees.getUserByEmployeeId,
      { employeeId: employee._id },
    )

    const profilePhotoUrl = profile?.profilePhotoStorageId
      ? await ctx.storage.getUrl(profile.profilePhotoStorageId)
      : null

    return {
      id: employee._id,
      userId: employee.userId,
      name: user?.name ?? '',
      email: user?.email ?? '',
      image: user?.image ?? null,
      profilePhotoUrl,
      role: employee.role,
      active: employee.active,
      createdAt: employee.createdAt,
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

export const adminUpdateEmployeeGeneral = organizationMutation({
  args: {
    employeeId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    address: v.string(),
    profilePhotoStorageId: v.optional(v.id('_storage')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireOrgOwner(ctx.session)
    const { activeOrganizationId: orgId } = ctx.session

    const employee = await getEmployeeInOrganization(ctx, orgId, args.employeeId)
    if (!employee) throw new Error('Employee not found.')

    const profile = await getOrCreateProfileForEmployee(ctx, employee._id)

    await ctx.db.patch(profile._id, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      dateOfBirth: args.dateOfBirth,
      address: args.address.trim(),
      ...(args.profilePhotoStorageId !== undefined
        ? { profilePhotoStorageId: args.profilePhotoStorageId }
        : {}),
    })

    return null
  },
})

export const adminUpdateEmployeeBankDetails = organizationMutation({
  args: {
    employeeId: v.string(),
    aadharNumber: v.string(),
    panNumber: v.string(),
    bankAccountNumber: v.string(),
    bankName: v.string(),
    ifscCode: v.string(),
    branchName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireOrgOwner(ctx.session)
    const { activeOrganizationId: orgId } = ctx.session

    const employee = await getEmployeeInOrganization(ctx, orgId, args.employeeId)
    if (!employee) throw new Error('Employee not found.')

    const profile = await getOrCreateProfileForEmployee(ctx, employee._id)

    await ctx.db.patch(profile._id, {
      aadharNumber: args.aadharNumber.trim(),
      panNumber: args.panNumber.trim().toUpperCase(),
      bankAccountNumber: args.bankAccountNumber.trim(),
      bankName: args.bankName.trim(),
      ifscCode: args.ifscCode.trim().toUpperCase(),
      branchName: args.branchName.trim(),
    })

    return null
  },
})

export const setEmployeeActive = organizationMutation({
  args: {
    employeeId: v.string(),
    active: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireOrgOwner(ctx.session)
    const { activeOrganizationId: orgId } = ctx.session

    if (args.employeeId === getActiveEmployeeId(ctx.session)) {
      throw new Error('You cannot change your own active status.')
    }

    const employee = await getEmployeeInOrganization(ctx, orgId, args.employeeId)
    if (!employee) throw new Error('Employee not found.')

    await ctx.runMutation(components.betterAuth.employees.setActive, {
      employeeId: args.employeeId,
      active: args.active,
    })

    return null
  },
})

export const removeEmployee = organizationMutation({
  args: { employeeId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    requireOrgOwner(ctx.session)
    const { activeOrganizationId: orgId } = ctx.session

    if (args.employeeId === getActiveEmployeeId(ctx.session)) {
      throw new Error('You cannot remove yourself from the organization.')
    }

    const employee = await getEmployeeInOrganization(ctx, orgId, args.employeeId)
    if (!employee) throw new Error('Employee not found.')

    const profile = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee._id))
      .unique()

    if (profile) {
      const certificates = await ctx.db
        .query('employeeCertificates')
        .withIndex('by_profile', (q) => q.eq('employeeProfileId', profile._id))
        .collect()

      for (const certificate of certificates) {
        await ctx.db.delete(certificate._id)
      }

      await ctx.db.delete(profile._id)
    }

    await ctx.runMutation(components.betterAuth.employees.removeFromOrganization, {
      employeeId: args.employeeId,
    })

    return null
  },
})

export const getInvitationById = query({
  args: { invitationId: v.string() },
  returns: invitationReturn,
  handler: async (ctx, args) => {
    const invitation = await ctx.runQuery(
      components.betterAuth.invitations.getById,
      { invitationId: args.invitationId },
    )
    if (!invitation) return null

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const session = await auth.api.getSession({ headers })

    return {
      ...invitation,
      user: session?.user ? sessionUserFromAuth(session) : null,
    }
  },
})
