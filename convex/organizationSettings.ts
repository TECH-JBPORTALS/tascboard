import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { authComponent, createAuth } from './auth'
import { organizationMutation, organizationQuery } from './lib/customFunctions'
import {
  buildOrganizationMetadata,
  parseOrganizationMetadata,
} from './lib/organizationMetadata'
import {
  DEFAULT_WORK_SCHEDULE,
  getWorkSchedule,
  saveWorkSchedule,
} from './lib/organizationWorkSchedule'
import { workScheduleValidator } from './tables/organizationWorkSchedule'

export const getWorkingSchedule = organizationQuery({
  args: {},
  returns: workScheduleValidator,
  handler: async (ctx) => {
    return await getWorkSchedule(ctx, ctx.session.activeOrganizationId)
  },
})

export const getSettings = organizationQuery({
  args: {},
  returns: v.object({
    id: v.string(),
    name: v.string(),
    slug: v.string(),
    address: v.string(),
    imageStorageId: v.optional(v.string()),
    workingSchedule: workScheduleValidator,
  }),
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const organization = await auth.api.getFullOrganization({ headers })

    if (!organization) {
      throw new Error('Organization not found')
    }

    const metadata = parseOrganizationMetadata(organization.metadata)

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      address: metadata.address,
      imageStorageId: metadata.imageStorageId,
      workingSchedule: await getWorkSchedule(ctx, organization.id),
    }
  },
})

export const updateSettings = organizationMutation({
  args: {
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    imageStorageId: v.optional(v.string()),
    workingSchedule: v.optional(workScheduleValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (ctx.session.employee.role !== 'owner') {
      throw new Error('Only organization owners can update settings')
    }

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    const organization = await auth.api.getFullOrganization({ headers })

    if (!organization) {
      throw new Error('Organization not found')
    }

    const organizationId = organization.id
    const currentMetadata = parseOrganizationMetadata(organization.metadata)

    if (
      args.name !== undefined ||
      args.address !== undefined ||
      args.imageStorageId !== undefined
    ) {
      const data: {
        name?: string
        metadata: ReturnType<typeof buildOrganizationMetadata>
      } = {
        metadata: buildOrganizationMetadata({
          address: args.address ?? currentMetadata.address,
          imageStorageId: args.imageStorageId ?? currentMetadata.imageStorageId,
        }),
      }

      if (args.name !== undefined) {
        const trimmedName = args.name.trim()
        if (!trimmedName) {
          throw new Error('Organization name is required')
        }
        data.name = trimmedName
      }

      await auth.api.updateOrganization({
        headers,
        body: { organizationId, data },
      })
    }

    if (args.workingSchedule) {
      await saveWorkSchedule(ctx, organizationId, args.workingSchedule)
    }

    return null
  },
})

export const ensureWorkSchedule = internalMutation({
  args: { organizationId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('organizationWorkSchedule')
      .withIndex('by_organization', (q) =>
        q.eq('organizationId', args.organizationId),
      )
      .unique()

    if (existing) return null

    await ctx.db.insert('organizationWorkSchedule', {
      organizationId: args.organizationId,
      ...DEFAULT_WORK_SCHEDULE,
    })

    return null
  },
})
