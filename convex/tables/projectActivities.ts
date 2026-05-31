import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const projectActivities = defineTable({
  projectId: v.id('projects'),
  organizationId: v.string(),
  actorUserId: v.string(),
  actorName: v.string(),
  kind: v.union(
    v.literal('created'),
    v.literal('name_changed'),
    v.literal('summary_changed'),
    v.literal('status_changed'),
    v.literal('start_date_changed'),
    v.literal('end_date_changed'),
    v.literal('icon_changed'),
    v.literal('color_changed'),
  ),
  fromValue: v.optional(v.string()),
  toValue: v.optional(v.string()),
  createdAt: v.number(),
})
  .index('by_project', ['projectId'])
  .index('by_project_actor', ['projectId', 'actorUserId'])
