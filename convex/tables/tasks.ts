import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const tasks = defineTable({
  trackId: v.id('tracks'),
  projectId: v.id('projects'),
  sprintId: v.optional(v.union(v.id('sprints'), v.null())),
  taskCode: v.string(),
  title: v.string(),
  description: v.optional(v.any()),
  status: v.union(
    v.literal('backlog'),
    v.literal('todo'),
    v.literal('in_progress'),
    v.literal('done'),
  ),
  createdBy: v.string(),
  priority: v.union(
    v.literal('low'),
    v.literal('medium'),
    v.literal('high'),
    v.literal('critical'),
  ),
  complexity: v.union(
    v.literal('easy'),
    v.literal('medium'),
    v.literal('hard'),
  ),
  dueDate: v.optional(v.union(v.number(), v.null())),
  statusOrder: v.optional(v.number()),
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
})
  .index('by_track', ['trackId'])
  .index('by_project', ['projectId'])
  .index('by_sprint', ['sprintId'])
  .index('by_track_status_order', ['trackId', 'status', 'statusOrder'])
  .index('by_track_status', ['trackId', 'status'])
  .index('by_track_priority', ['trackId', 'priority'])
  .index('by_track_sprint', ['trackId', 'sprintId'])
  .index('by_track_dueDate', ['trackId', 'dueDate'])
  .index('by_track_status_priority', ['trackId', 'status', 'priority'])
