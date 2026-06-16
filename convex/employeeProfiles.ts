import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { internalMutation, type MutationCtx } from './_generated/server'
import {
  organizationInternalQuery,
  organizationMutation,
  organizationQuery,
} from './lib/customFunctions'
import { vv } from './schema'

/** Controll how many certificates can be uploaded by an employee. */
const MAX_CERTIFICATES = 5

/** The return type for the getMyProfile query. */
const profileReturn = vv.doc('employeeProfiles').omit('_id', '_creationTime')

export const getInternalEmployeeProfile = organizationInternalQuery({
  args: {
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', args.employeeId))
      .unique()

    return profile ?? null
  },
})

/**
 * This suppose to create a profile for the user if they don't have one after they accept an invitation. only be used by the betterAuth hooks.
 * @returns The ID of the created profile.
 */
export const ensureProfileAfterInvite = internalMutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: vv.id('employeeProfiles'),
  handler: async (ctx, args) => {
    const employee = await ctx.runQuery(
      components.betterAuth.employees.getByOrganizationUser,
      {
        organizationId: args.organizationId,
        userId: args.userId,
      },
    )

    if (!employee) {
      throw new Error('Employee record not found after invitation acceptance.')
    }

    const existing = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee._id))
      .unique()

    if (existing) {
      return existing._id
    }

    return await ctx.db.insert('employeeProfiles', {
      employeeId: employee._id,
      onboardingStatus: 'pending',
      onboardingStep: 0,
    })
  },
})

/**
 * This query returns the onboarding status of the current user.
 * @returns The onboarding status of the current user.
 */
export const getMyOnboardingStatus = organizationQuery({
  args: {},
  returns: v.union(
    v.object({
      organizationId: v.string(),
      organizationSlug: v.string(),
      onboardingStatus: v.union(v.literal('pending'), v.literal('completed')),
      onboardingStep: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const { activeOrganizationId, userId } = ctx.session

    const employee = await ctx.runQuery(
      components.betterAuth.employees.getByOrganizationUser,
      {
        organizationId: activeOrganizationId,
        userId: userId,
      },
    )

    if (!employee) return null

    const profile = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee._id))
      .unique()

    if (!profile) return null

    const organization = await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: 'organization',
        where: [{ field: '_id', operator: 'eq', value: activeOrganizationId }],
      },
    )

    const org = organization as { slug: string } | null

    return {
      organizationId: activeOrganizationId,
      organizationSlug: org?.slug ?? '',
      onboardingStatus: profile.onboardingStatus,
      onboardingStep: profile.onboardingStep,
    }
  },
})

/**
 * This query returns the profile of the current user.
 * @returns The profile of the current user.
 */
export const getMyProfile = organizationQuery({
  args: {},
  returns: v.union(profileReturn, v.null()),
  handler: async (ctx) => {
    const { employee } = ctx.session

    const profile = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee.id))
      .unique()

    if (!profile) return null

    const certificates = await ctx.db
      .query('employeeCertificates')
      .withIndex('by_profile', (q) => q.eq('employeeProfileId', profile._id))
      .take(MAX_CERTIFICATES)

    return {
      ...profile,
      certificates: certificates.map((c) => ({
        _id: c._id,
        storageId: c.storageId,
        fileName: c.fileName,
        contentType: c.contentType,
      })),
    }
  },
})

/**
 * This helper function is used to get or create a profile for the current user.
 * @param ctx - The context object.
 * @param employeeId - The ID of the employee.
 * @returns The profile of the created or existing profile.
 */
async function getOrCreateMyProfile(
  ctx: MutationCtx,
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

/**
 * This mutation is used to save the general information of the current user.
 * @param ctx - The context object.
 * @param args - The arguments object.
 * @returns The null.
 */
export const saveGeneralInfo = organizationMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    address: v.string(),
    profilePhotoStorageId: v.optional(v.id('_storage')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { employee } = ctx.session
    const profile = await getOrCreateMyProfile(ctx, employee.id)

    await ctx.db.patch(profile._id, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      dateOfBirth: args.dateOfBirth,
      address: args.address.trim(),
      profilePhotoStorageId: args.profilePhotoStorageId,
      onboardingStep: Math.max(profile.onboardingStep, 1),
    })

    return null
  },
})

export const saveGovernmentId = organizationMutation({
  args: {
    aadharNumber: v.string(),
    panNumber: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { employee } = ctx.session
    const profile = await getOrCreateMyProfile(ctx, employee.id)

    await ctx.db.patch(profile._id, {
      aadharNumber: args.aadharNumber.trim(),
      panNumber: args.panNumber.trim().toUpperCase(),
      onboardingStep: Math.max(profile.onboardingStep, 2),
    })

    return null
  },
})

/**
 * This mutation is used to save the bank details of the current user in onboarding process.
 * @returns The null.
 */
export const saveBankDetails = organizationMutation({
  args: {
    bankAccountNumber: v.string(),
    bankName: v.string(),
    ifscCode: v.string(),
    branchName: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { employee } = ctx.session
    const profile = await getOrCreateMyProfile(ctx, employee.id)

    await ctx.db.patch(profile._id, {
      bankAccountNumber: args.bankAccountNumber.trim(),
      bankName: args.bankName.trim(),
      ifscCode: args.ifscCode.trim().toUpperCase(),
      branchName: args.branchName.trim(),
      onboardingStep: Math.max(profile.onboardingStep, 3),
    })

    return null
  },
})

/**
 * This mutation is used to add a certificate to the current user's profile in onboarding process.
 * @param storageId - The ID of the storage object.
 * @param fileName - The name of the file.
 * @param contentType - The content type of the file.
 * @returns The ID of the created certificate.
 */
export const addCertificate = organizationMutation({
  args: {
    storageId: v.id('_storage'),
    fileName: v.string(),
    contentType: v.string(),
  },
  returns: vv.id('employeeCertificates'),
  handler: async (ctx, args) => {
    const { employee } = ctx.session
    const profile = await getOrCreateMyProfile(ctx, employee.id)

    const existing = await ctx.db
      .query('employeeCertificates')
      .withIndex('by_profile', (q) => q.eq('employeeProfileId', profile._id))
      .take(MAX_CERTIFICATES + 1)

    if (existing.length >= MAX_CERTIFICATES) {
      throw new Error(`You can upload at most ${MAX_CERTIFICATES} documents.`)
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(args.contentType)) {
      throw new Error('Only PDF, JPG, JPEG, and PNG files are allowed.')
    }

    return await ctx.db.insert('employeeCertificates', {
      employeeProfileId: profile._id,
      organizationId: employee.organizationId,
      storageId: args.storageId,
      fileName: args.fileName,
      contentType: args.contentType,
    })
  },
})

/**
 * This mutation is used to remove a certificate from the current user's profile.
 * @param certificateId - The ID of the certificate to remove.
 * @returns The null.
 */
export const removeCertificate = organizationMutation({
  args: { certificateId: vv.id('employeeCertificates') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { activeOrganizationId, employee } = ctx.session
    const cert = await ctx.db.get(args.certificateId)

    if (!cert || cert.organizationId !== activeOrganizationId) {
      throw new Error('Certificate not found.')
    }

    const profile = await ctx.db
      .query('employeeProfiles')
      .withIndex('by_employee', (q) => q.eq('employeeId', employee.id))
      .unique()

    if (!profile || cert.employeeProfileId !== profile._id) {
      throw new Error('Certificate not found.')
    }

    await ctx.db.delete(args.certificateId)
    return null
  },
})

/**
 * This mutation is used to complete the onboarding process for the current user.
 * @returns The null.
 * @throws An error if the general information, government ID details, bank details are not completed.
 */
export const completeOnboarding = organizationMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const { activeOrganizationId, userId, employee } = ctx.session
    const profile = await getOrCreateMyProfile(ctx, employee.id)
    if (!profile.aadharNumber || !profile.panNumber) {
      throw new Error('Please complete government ID details first.')
    }

    if (
      !profile.bankAccountNumber ||
      !profile.bankName ||
      !profile.ifscCode ||
      !profile.branchName
    ) {
      throw new Error('Please complete bank details first.')
    }

    await ctx.db.patch(profile._id, {
      onboardingStatus: 'completed',
      onboardingStep: 4,
    })

    const inboxItems = await ctx.db
      .query('inboxItems')
      .withIndex('by_org_recipient_archived', (q) =>
        q
          .eq('organizationId', activeOrganizationId)
          .eq('recipientUserId', userId)
          .eq('archived', false),
      )
      .take(20)

    for (const item of inboxItems) {
      if (item.kind !== 'onboarding') continue
      await ctx.db.patch(item._id, {
        read: true,
        archived: true,
        snippet: "Profile complete — you're all set",
        body: 'Thanks for completing your employee profile. Your details are on file and your team can reach you when needed.',
      })
    }

    return null
  },
})
