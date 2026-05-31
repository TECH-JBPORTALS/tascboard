import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const subtasks = defineTable({
  taskId: v.id('tasks'),
  title: v.string(),
  completed: v.boolean(),
  order: v.number(),
}).index('by_task_and_order', { fields: ['taskId', 'order'] })
