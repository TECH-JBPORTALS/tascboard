import { defineTable } from 'convex/server'
import { v } from 'convex/values'

export const labels = defineTable({
  name: v.string(),
  color: v.string(),
  projectId: v.id('projects'),
}).index('by_project', { fields: ['projectId'] })
