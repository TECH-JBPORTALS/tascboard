import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { organizationQuery, privateMutation } from './helpers/customFunctions'
import { vv } from './schema'

export const toggleMember = privateMutation({
  args: {
    employeeId: v.string(),
    projectId: vv.id('projects'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('projectMember')
      .withIndex('by_project_employee', (q) =>
        q.eq('projectId', args.projectId).eq('employeeId', args.employeeId),
      )
      .unique()
    if (existing) {
      await ctx.db.delete(existing._id)
      return null
    }

    await ctx.db.insert('projectMember', {
      projectId: args.projectId,
      employeeId: args.employeeId,
      manager: false,
      assignedBy: ctx.session.user._id,
      createdAt: Date.now(),
    })

    return null
  },
})

export const setManager = privateMutation({
  args: {
    employeeId: v.string(),
    projectId: vv.id('projects'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingMember = await ctx.db
      .query('projectMember')
      .withIndex('by_project_employee', (q) =>
        q.eq('projectId', args.projectId).eq('employeeId', args.employeeId),
      )
      .unique()

    const existingManager = await ctx.db
      .query('projectMember')
      .withIndex('by_project_manager', (q) =>
        q.eq('projectId', args.projectId).eq('manager', true),
      )
      .unique()

    if (existingManager && existingManager.employeeId !== args.employeeId) {
      await ctx.db.patch(existingManager._id, {
        manager: false,
        updatedAt: Date.now(),
      })
    }

    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        manager: true,
        updatedAt: Date.now(),
      })
      return null
    }
    await ctx.db.insert('projectMember', {
      projectId: args.projectId,
      employeeId: args.employeeId,
      manager: true,
      assignedBy: ctx.session.user._id,
      createdAt: Date.now(),
    })

    return null
  },
})

/**
 * REMOVE MANAGER ROLE ONLY
 * (still remains a member)
 */
export const removeManager = privateMutation({
  args: {
    employeeId: v.string(),
    projectId: vv.id('projects'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query('projectMember')
      .withIndex('by_project_employee', (q) =>
        q.eq('projectId', args.projectId).eq('employeeId', args.employeeId),
      )
      .unique()

    if (!member) {
      throw new Error('Member not found')
    }

    await ctx.db.patch(member._id, {
      manager: false,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const list = organizationQuery({
  args: {
    projectId: vv.id('projects'),
    manager: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let members: Doc<'projectMember'>[] = []

    if (args.manager !== undefined) {
      const manager = args.manager
      members = await ctx.db
        .query('projectMember')
        .withIndex('by_project_manager', (q) =>
          q.eq('projectId', args.projectId).eq('manager', manager),
        )
        .collect()
    } else {
      members = await ctx.db
        .query('projectMember')
        .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
        .collect()
    }

    const results = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query('employeeProfiles')
          .withIndex('by_employee', (q) =>
            q.eq('employeeId', member.employeeId),
          )
          .first()

        const image = profile?.profilePhotoStorageId
          ? await ctx.storage.getUrl(profile.profilePhotoStorageId)
          : ''

        const employee = await ctx.runQuery(
          components.betterAuth.employees.getByOrganizationUser,
          {
            userId: member.employeeId,
            organizationId: ctx.session.activeOrganizationId,
          },
        )

        const user = await ctx.runQuery(components.betterAuth.users.getById, {
          id: employee.userId,
        })

        return {
          _id: member._id,
          employeeId: member.employeeId,
          manager: member.manager,
          employee: {
            _id: profile?.employeeId ?? member.employeeId,
            name: profile?.firstName
              ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
              : (user?.name ?? 'Unknown'),
            image: image,
            email: user?.email,
          },
        }
      }),
    )

    return results
  },
})
