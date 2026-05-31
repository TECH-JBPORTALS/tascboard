import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const taskActivities = defineTable({
  taskId: v.id('tasks'),
  actorName: v.string(),
  actorUserId: v.optional(v.string()),
  kind: v.union(
    v.literal('created'),
    v.literal('title_changed'),
    v.literal('status_changed'),
    v.literal('priority_changed'),
    v.literal('due_date_changed'),
    v.literal('label_added'),
    v.literal('label_removed'),
  ),
  fromValue: v.optional(v.string()),
  toValue: v.optional(v.string()),
  meta: v.optional(v.string()),
  createdAt: v.optional(v.number()),
}).index('by_task', { fields: ['taskId'] })
