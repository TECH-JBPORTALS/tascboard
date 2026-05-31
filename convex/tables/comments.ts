import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const comments = defineTable({
  taskId: v.id('tasks'),
  parentCommentId: v.union(v.id('comments'), v.null()),
  deviceName: v.string(),
  body: v.any(),
  editedAt: v.optional(v.number()),
  isResolution: v.optional(v.boolean()),
}).index('by_task', { fields: ['taskId'] })
