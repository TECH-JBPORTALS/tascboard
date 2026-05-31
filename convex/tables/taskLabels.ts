import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const taskLabels = defineTable({
  taskId: v.id('tasks'),
  labelId: v.id('labels'),
})
  .index('by_task', { fields: ['taskId'] })
  .index('by_label', { fields: ['labelId'] })
