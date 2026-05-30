import { v } from 'convex/values'
import { privateInternalMutation } from './lib/customFunctions'

export const seedProjectMember = privateInternalMutation({
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
      createdAt: Date.now(),

      updatedAt: undefined,
    })
  },
})

export const seedTrackMember = privateInternalMutation({
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
