import { v } from 'convex/values'
import { components } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { organizationQuery, privateMutation } from './helpers/customFunctions'
import { vv } from './schema'

export const toggleMember = privateMutation({
  args: {
    taskId: vv.id('tasks'),
    employeeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('taskMember')
      .withIndex('by_task_employee', (q) =>
        q.eq('taskId', args.taskId).eq('employeeId', args.employeeId),
      )
      .unique()

    if (existing) {
      await ctx.db.delete(existing._id)
      return null
    }
    await ctx.db.insert('taskMember', {
      taskId: args.taskId,
      employeeId: args.employeeId,
      lead: false,
      assignedAt: Date.now(),
      createdAt: Date.now(),
    })
    return null
  },
})

export const setLead = privateMutation({
  args: {
    taskId: vv.id('tasks'),
    employeeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existingMember = await ctx.db
      .query('taskMember')
      .withIndex('by_task_employee', (q) =>
        q.eq('taskId', args.taskId).eq('employeeId', args.employeeId),
      )
      .unique()
    const existingLead = await ctx.db
      .query('taskMember')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .filter((q) => q.eq(q.field('lead'), true))
      .first()

    if (existingLead && existingLead.employeeId !== args.employeeId) {
      await ctx.db.patch(existingLead._id, {
        lead: false,
        updatedAt: Date.now(),
      })
    }
    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        lead: true,
        updatedAt: Date.now(),
      })
      return null
    }
    await ctx.db.insert('taskMember', {
      taskId: args.taskId,
      employeeId: args.employeeId,
      lead: true,
      assignedAt: Date.now(),
      createdAt: Date.now(),
    })
    return null
  },
})

export const unsetLead = privateMutation({
  args: {
    taskId: vv.id('tasks'),
    employeeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query('taskMember')
      .withIndex('by_task_employee', (q) =>
        q.eq('taskId', args.taskId).eq('employeeId', args.employeeId),
      )
      .unique()
    if (!member) {
      throw new Error('Member not found')
    }
    await ctx.db.patch(member._id, {
      lead: false,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const list = organizationQuery({
  args: {
    taskId: vv.id('tasks'),
    lead: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let members: Doc<'taskMember'>[] = []

    if (args.lead !== undefined) {
      const lead = args.lead

      members = await ctx.db
        .query('taskMember')
        .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
        .filter((q) => q.eq(q.field('lead'), lead))
        .collect()
    } else {
      members = await ctx.db
        .query('taskMember')
        .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
        .collect()
    }

    const results = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query('employeeProfiles')
          .withIndex('by_employee', (q) =>
            q.eq('employeeId', member.employeeId),
          )
          .unique()

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
          lead: member.lead,
          employee: {
            _id: profile?.employeeId ?? member.employeeId,
            name: profile
              ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
              : (user?.name ?? 'Unknown'),
            email: user?.email ?? 'unknown',
            image: image ?? '',
          },
        }
      }),
    )

    return results
  },
})
