import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const dailyReportTaskTag = defineTable({
  reportId: v.id('dailyReport'),
  taskId: v.id('tasks'),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index('by_reportId', ['reportId'])
  .index('by_reportId_taskId', ['reportId', 'taskId'])
  .index('by_task', ['taskId'])
