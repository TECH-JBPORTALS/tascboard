import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

export const seedProjectMember = internalMutation({
  args: {
    projectId: v.id('projects'),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('projectMember', {
      projectId: args.projectId,
      employeeId: args.employeeId,
      assignedBy: 'test-system',
      manager: false,
      createAt: Date.now(),

      updatedAt: undefined,
    })
  },
})

export const seedTrackMember = internalMutation({
  args: {
    trackId: v.id('tracks'),
    employeeId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('trackMember', {
      trackId: args.trackId,
      employeeId: args.employeeId,
      createdAt: Date.now(),
      assignedAt: Date.now(),
      lead: false,

      updatedAt: undefined,
    })
  },
})
